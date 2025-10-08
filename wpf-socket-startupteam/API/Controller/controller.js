
const { Op } = require('sequelize');
const {User,Version} = require('../../src/database/sequelize');
const {Referral,ReferralClick,Device, ReferralReward,Friends} = require('../../src/database/sequelize');
const fs = require("fs").promises;
const path = require("path");
const { getSettings, updateSettings } = require('../../pingConfig');
const imagesFolder = path.join(__dirname, "../../Assets/ProfileImages");
// Global cache variables
const cacheTTL = 60000; // Cache time-to-live in milliseconds (e.g., 60 seconds)
let cachedImageLinks = null;
let lastCacheTime = 0;
const crypto = require('crypto');


const _hashDevice = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const deviceId = req.cookies.deviceId || '';
  console.log("in controller hash function, deviceId cookie value is: "+deviceId)

  const components = [
    userAgent,
    acceptLanguage,
    deviceId
  ];

  return require('crypto').createHash('sha256').update(components.join('|')).digest('hex');
};


const baseURL =
  `https://wawe-poker-api-handeling-fabddf98b575.herokuapp.com/Assets/ProfileImages/`;
const googleBotIdentifiers = {
  email: "wawepoker523@gmail.com",
  iosemail:"usmanaslamofce@icloud.com",
  facebookId: "122094919244688231",
  number: "+12345678900",
};

const phoneLogin = async (req, res) => {
  try {
    const { username, phone, udid } = req.body;
    // Single union query to check for an existing user by phone or UDID

    if (phone === googleBotIdentifiers.number) {
      let botUser = await User.findOne({
        where: { number: googleBotIdentifiers.number },
        raw: true,
      });
        const [ , [updatedBotUser] ] = await User.update(
          { LoginStatus: true },
          { where: { id: botUser.id }, returning: true }
        );
        return res.json({
          success: true,
          user: updatedBotUser,
          startupPopup: true,
          Test: true,
        });
    }
    let user = await User.findOne({
      where: {
        [Op.or]: [{ number: phone }, { udid: udid }]
      },
      raw: true
    });

    if (user) {

      if (user.number === phone) {
        if (user.udid !== udid) {
          return res.json({ success: false, message: "Device verification failed. Please ensure you're using your registered device." });
        }
        const [ , [updatedUser] ] = await User.update(
          { LoginStatus: true },
          { where: { id: user.id }, returning: true }
        );
        return res.json({ success: true, user: updatedUser, startupPopup: true });
      }

      // User found via UDID but phone does not match
      if (user.udid === udid) {
        if (!user.number) {
          return res.json({ success: false, message: "No phone number is linked to your account.", user });
        } else {
          return res.json({ success: false, message:"This device is already registered with a different phone number.", user });
        }
      }
    } else {
      // No user found; create new user
      const newUser = await User.create({
        name: username,
        number: phone,
        udid,
        profileImageLink: `${baseURL}snow_man.png`,
        LoginStatus: true
      });
        
      const verifyUrl = `${process.env.BASE_URL}/auth/verify-referral?userId=${newUser.id}`;
      console.log("verifyUrl in phone login:" +verifyUrl)
      return res.json({
        success: true,
        user: newUser,
        startupPopup: false,
        verifyUrl
      });
    }
  } catch (err) {
    console.error('Error during phoneLogin:', err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

const usernameupdate = async (req, res) => {
  try {
    const { name, username, countrycode, profileImageLink, udid } = req.body;
    
    // Validate that UDID is provided
    if (!udid) {
      return res.status(400).json({ success: false, message:"Device identifier is required. "});
    }
    
    // Check if the desired username is already taken by another user
    if (username) {
      const existingUsername = await User.findOne({
        where: { username, udid: { [Op.ne]: udid } }
      });
      if (existingUsername) {
        // Generate 5 username suggestions
        const suggestions = Array.from(
          { length: 5 },
          () => `${username}${Math.floor(Math.random() * 10000)}`
        );
        return res.json({ success: false, message: "The username is already in use. Please choose a different one.", suggestions });
      }
    }
    
    // Update the user record and return the updated record using a single query
    const [updateCount, updatedUsers] = await User.update(
      { name, countrycode, profileImageLink, username },
      { where: { udid }, returning: true }
    );
    
    if (updateCount > 0) {
      return res.json({ success: true, user: updatedUsers[0] });
    } else {
      return res.json({ success: false, message: "User with the provided UDID was not found." });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

const phoneverify = async (req, res) => {
  try {
    const { phone, udid } = req.body;
    // Fetch user by phone and user by UDID concurrently
    const [userByPhone, userByUdid] = await Promise.all([
      User.findOne({ where: { number: phone } }),
      User.findOne({ where: { udid: udid } })
    ]);

    // Special case: if the user with the given phone is the bot account, update and return immediately
    if (userByPhone && userByPhone.number === googleBotIdentifiers.number) {
      const [ , [updatedUser] ] = await User.update(
        { LoginStatus: true },
        { where: { id: userByPhone.id }, returning: true }
      );
      return res.json({ success: true, user: updatedUser, Test: true });
    }

    // If both queries return a user and they refer to the same record, return that user
    if (userByPhone && userByUdid && userByPhone.id === userByUdid.id) {
      return res.json({ success: true, user: userByPhone });
    }

    // If a user is found by UDID but there's no phone record and no number in that record,
    // then the phone is not associated with the connected user
    if (userByUdid && !userByUdid.number && !userByPhone) {
      return res.json({ success: false, message: "No phone number is linked to this device.", user: userByUdid });
    }

    // Check if phone-based user exists but the UDID does not match
    if (userByPhone && userByPhone.udid !== udid) {
      return res.json({ success: false, message: "The provided device identifier does not match our records for the phone number." });
    }

    // Check if UDID-based user exists but the phone does not match
    if (userByUdid && userByUdid.number !== phone) {
      return res.json({ success: false, message: "The phone number provided does not match our records for this device." });
    }

    // If neither user is found, return success with an appropriate message
    if (!userByPhone && !userByUdid) {
      return res.json({ success: true, message: "No account found for the provided phone number and device identifier." });
    }

    // Fallback response if none of the conditions match
    return res.json({ success: false, message: "Unexpected error occurred" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const phoneingameverify = async (req, res) => {
  try {
    const { phone, udid } = req.body;

    // Fetch user by phone and by UDID concurrently
    const [userByPhone, userByUdid] = await Promise.all([
      User.findOne({ where: { number: phone } }),
      User.findOne({ where: { udid: udid } })
    ]);

    // Return true if phone record does not exist and UDID record exists with null number
    if (!userByPhone && userByUdid && userByUdid.number === null) {
      return res.json({ success: true });
    }
    if(userByPhone && userByUdid && userByPhone.id === userByUdid.id){
      return res.json({ success: false, message: "This phone number is already Registered." });
    }
    // Check if phone record exists but UDID does not match
    if (userByPhone && userByPhone.udid !== udid) {
      return res.json({ success: false, message: "The provided device identifier does not match the one associated with your phone number." });
    }

    // Check if UDID record exists but phone does not match
    if (userByUdid && userByUdid.number !== phone) {
      return res.json({ success: false, message: "The phone number provided does not match the one registered with this device."  });
    }

    // Otherwise, return false
    return res.json({ success: false });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const verifyPhone = async (req, res) => {
  try {
    const { phone, udid } = req.body;
    
    // Run both queries in parallel
    const [userByPhone, userByUdid] = await Promise.all([
      User.findOne({ where: { number: phone } }),
      User.findOne({ where: { udid } })
    ]);
    
    // If a user with the provided phone exists, abort
    if (userByPhone) {
      return res.json({ success: false, message: "An account with this phone number already exists." });
    }
    
    // If a user with the provided UDID exists and has a number that doesn't match, abort
    if (userByUdid && userByUdid.number && userByUdid.number !== phone) {
      return res.json({ success: false, message: "The phone number provided does not match the one registered with this device." });
    }
    
    // Optionally, check if userByUdid exists at all
    if (!userByUdid) {
      return res.json({ success: false, message:  "No account found for the provided device identifier."  });
    }
    
    // Update the user's number and return the updated record in one operation
    const [updateCount, updatedUsers] = await User.update(
      { number: phone },
      { where: { udid }, returning: true }
    );
    
    return res.json({ success: true, user: updatedUsers[0] });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const googleLogin = async (req, res) => {
  try {
    const { username, udid, email, DPLink } = req.body;
    console.log(
      `this is username ${username}, this is udid ${udid}, this is email ${email}, this is DPLink ${DPLink}`
    );

    // Attempt to find user by email
    let user = await User.findOne({ where: { email } });

    // If user found and email matches one of the special bot identifiers
    if (user && (user.email === googleBotIdentifiers.email || user.email === googleBotIdentifiers.iosemail)) {
      const [updateCount, [updatedUser]] = await User.update(
        { LoginStatus: true },
        { where: { id: user.id }, returning: true }
      );
      return res.json({ success: true, user: updatedUser, startupPopup: true, Test: true });
    }

    // If user found by email
    if (user) {
      if (user.udid !== udid) {
        return res.json({ success: false, message: "The device identifier does not match our records. " });
      }
      // Update user record in one query with returning
      const [updateCount, [updatedUser]] = await User.update(
        { LoginStatus: true, googleProfileImageLink: DPLink ? DPLink : `${baseURL}snow_man.png` },
        { where: { udid }, returning: true }
      );
      return res.json({ success: true, user: updatedUser, startupPopup: true });
    }

    // If no user found by email, attempt to find by UDID
    user = await User.findOne({ where: { udid } });
    if (user) {
      if (!user.email) {
        return res.json({ success: false, message: "No email is associated with this account.", user });
      } else {
        return res.json({ success: false, message: "An account with this device already exists.", user });
      }
    }

    // If no user found by email or UDID, create a new user
    const newUser = await User.create({
      name: username,
      email,
      udid,
      googleProfileImageLink: DPLink ? DPLink : `${baseURL}snow_man.png`,
      LoginStatus: true
    });

    
      const verifyUrl = `${process.env.BASE_URL}/auth/verify-referral?userId=${newUser.id}`;
      console.log("verifyUrl :" +verifyUrl)
      return res.json({
        success: true,
        user: newUser,
        startupPopup: false,
        verifyUrl
      });

    
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}; 

//ref
const verifyReferral = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).send("Missing userId.");

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).send("User not found.");

    const deviceHash = _hashDevice(req);
    console.log(`Verifying referral for user ${userId}, hash: ${deviceHash}`);

    let referralVerified = false;

    const refClick = await ReferralClick.findOne({
      where: { deviceHash },
      order: [["createdAt", "DESC"]],
    });    

    if (refClick) {
      if (refClick.converted) {
        console.log(`Device already converted with user ${refClick.convertedUserId}`);
        refClick.fraudScore += 10;
        await refClick.save();
      } else {
        refClick.converted = true;
        refClick.convertedAt = new Date();
        refClick.convertedUserId = userId;

        console.log(`Device marked as converted for user ${userId}`);

        const referral = await Referral.findByPk(refClick.referralId);
        if (referral) {
          const referrerId = referral.referrerId;
          refClick.referrerId = referrerId;
          refClick.friendsMade = true;
          console.log(`User ${userId} was referred by user ${referrerId}`);

          referral.conversionCount += 1;

          await ReferralClick.destroy({
            where: {
              deviceHash,
              id: { [Op.ne]: refClick.id },
              friendsMade: { [Op.not]: true },
            },
          });

          await refClick.save();
          await referral.save();

          await ReferralReward.create({
            referralClickId: refClick.id,
            referrerId: referrerId,
            refereeId: userId,
            rewardType: "signup",
            referralId: refClick.referralId
          });

          referralVerified = true;
          console.log("ReferralReward created for referrer and referee.");
          // Fetch User names
          const [referrerUser, refereeUser] = await Promise.all([
          User.findByPk(referrerId),
          User.findByPk(userId),
          ]);

          if (!referrerUser || !refereeUser) {
             console.log("❌ Could not fetch user data for friendship creation.");
          } else {
            const existingFriend = await Friends.findOne({
            where: {
            idMyPlayer: referrerId,
            idOtherPlayer: userId,
            },
        });

        if (!existingFriend) {
          await Friends.create({
           idMyPlayer: referrerId,
           idOtherPlayer: userId,
           FriendStatus: "Accept",
           NameMyPlayer: referrerUser.name,
           NameOtherPlayer: refereeUser.name,
           OnlineStatus: false,
          });

        console.log(`✅friendship created: ${referrerUser.name} → ${refereeUser.name}`);
        } else {
       console.log(`ℹ️ Friendship already exists between ${referrerId} and ${userId}`);
        }
      }

        }
      }
    }

    // Dynamic message and link status
    const message = referralVerified
      ? "✅ Referral Verified"
      : "⚠️ Referral Not Verified";

    const subMessage = referralVerified
      ? "You can now return to the app and claim your reward."
      : "No valid referral was found. You can still use the app.";

    const deeplinkStatus = referralVerified ? "true" : "false";

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${message}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: sans-serif;
              text-align: center;
              padding-top: 60px;
            }
            button {
              font-size: 18px;
              padding: 12px 20px;
              background-color: #28a745;
              color: white;
              border: none;
              border-radius: 8px;
              margin-top: 20px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <h2>${message}</h2>
          <p>${subMessage}</p>
          <button onclick="location.href='wawepokerface://deeplink/${deeplinkStatus}'">Return to App</button>
          <script>
  // Automatically click the button after 2 seconds
  setTimeout(() => {
    document.querySelector('button').click();
  }, 2000);

  // Also close the tab after 20 seconds (optional)
  setTimeout(() => {
    window.open('', '_self');
    window.close();
  }, 20000);
</script>

        </body>
      </html>
    `);
  } catch (error) {
    console.error("verifyReferral error:", error);
    res.status(500).send("Internal server error");
  }
};
//////
//verify frined invite link
const verifyFriendInvite = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).send("Missing userId.");

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).send("User not found.");

    const deviceHash = _hashDevice(req);
    console.log(`Verifying friend for user ${userId}, hash: ${deviceHash}`);

    let friendVerified = false;
    let referrerUser = null;
    let refereeUser = null;

    const refClick = await ReferralClick.findOne({
      where: { deviceHash },
      order: [["createdAt", "DESC"]],
    });

    if (refClick) {
      if (refClick.friendsMade) {
        console.log(`User is already friends with user ${refClick.convertedUserId}`);
        refClick.fraudScore += 10;
        await refClick.save();
      } else {
        refClick.friendsMade = true;
        refClick.convertedUserId = userId;
        refClick.convertedAt = new Date();

        const referral = await Referral.findByPk(refClick.referralId);
        if (referral) {
          const referrerId = referral.referrerId;
          refClick.referrerId = referrerId;
          console.log(`User ${userId} was invited for friendship by user ${referrerId}`);

          referral.conversionCount += 1;

          await ReferralClick.destroy({
            where: {
              deviceHash,
              id: { [Op.ne]: refClick.id },
              converted: { [Op.not]: true },
            },
          });

          await refClick.save();
          await referral.save();

          // Fetch user names
          [referrerUser, refereeUser] = await Promise.all([
            User.findByPk(referrerId),
            User.findByPk(userId),
          ]);

          if (!referrerUser || !refereeUser) {
            console.log("❌ Could not fetch user data for friendship creation.");
          } else {
            const { Op } = require("sequelize");

            const existingFriend = await Friends.findOne({
              where: {
                [Op.or]: [
                  { idMyPlayer: referrerId, idOtherPlayer: userId },
                  { idMyPlayer: userId, idOtherPlayer: referrerId },
                ],
              },
            });

            if (existingFriend) {
              if (existingFriend.FriendStatus !== "Accept") {
                existingFriend.FriendStatus = "Accept";
                await existingFriend.save();
                friendVerified = true;
                console.log(`✅ Friendship status updated to 'Accept' between ${referrerId} and ${userId}`);
              } else {
                console.log(`ℹ️ Already friends.`);
              }
            } else {
              await Friends.create({
                idMyPlayer: referrerId,
                idOtherPlayer: userId,
                FriendStatus: "Accept",
                NameMyPlayer: referrerUser.name,
                NameOtherPlayer: refereeUser.name,
                OnlineStatus: false,
              });
              friendVerified = true;
              console.log(`✅ Friendship created: ${referrerUser.name} → ${refereeUser.name}`);
            }
          }
        }
      }
    }

    // Dynamic message and link status
    const message = friendVerified
      ? "✅ Friends Verified"
      : "⚠️ Friends Not Verified";

    const subMessage = friendVerified
      ? "You can now return to the Game."
      : "No valid friend was found. You can continue to the game.";

    const deeplinkStatus = friendVerified ? (referrerUser?.name || "unknown") : "false";

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${message}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: sans-serif;
              text-align: center;
              padding-top: 60px;
            }
            button {
              font-size: 18px;
              padding: 12px 20px;
              background-color: #28a745;
              color: white;
              border: none;
              border-radius: 8px;
              margin-top: 20px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <h2>${message}</h2>
          <p>${subMessage}</p>
          <button onclick="location.href='wawepokerface://deeplink/friend/${deeplinkStatus}'">Return to App</button>
          <script>
            setTimeout(() => {
              document.querySelector('button').click();
            }, 2000);

            setTimeout(() => {
              window.open('', '_self');
              window.close();
            }, 20000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("verifyReferral error:", error);
    res.status(500).send("Internal server error");
  }
};




const googleLoginVerify = async (req, res) => {
  try {
    const { email, udid, DPLink } = req.body;

    // Fetch user by email and user by UDID concurrently
    const [userByEmail, userByUdid] = await Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { udid } })
    ]);

    // If a user with the provided email exists, abort
    if (userByEmail) {
      return res.json({ success: false, message: "An account with this email already exists." });
    }

    // If a user exists for the provided UDID and its email doesn't match the provided one, abort
    if (userByUdid && userByUdid.email && userByUdid.email !== email) {
      return res.json({ success: false, message: "The provided email does not match the one registered with this device." });
    }

    // Otherwise, update the user's email and profile image link in a single query
    const [updateCount, updatedUsers] = await User.update(
      {
        email,
        googleProfileImageLink: DPLink
          ? DPLink
          : `https://wawe-poker-api-handeling-fabddf98b575.herokuapp.com/Assets/ProfileImages/snow_man.png`
      },
      { where: { udid }, returning: true }
    );

    return res.json({ success: true, user: updatedUsers[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const facebookLogin = async (req, res) => {
  try {
    const { username, udid, facebookid, DPLink } = req.body;
    
    // Fetch user by facebookid and by udid concurrently
    const [userByFacebook, userByUdid] = await Promise.all([
      User.findOne({ where: { facebookid } }),
      User.findOne({ where: { udid } })
    ]);

    // Special case: if the user found by facebookid is the bot account, update and return immediately.
    if (userByFacebook && userByFacebook.facebookid === googleBotIdentifiers.facebookId) {
      const [ , [updatedUser]] = await User.update(
        { LoginStatus: true },
        { where: { id: userByFacebook.id }, returning: true }
      );
      return res.json({ success: true, user: updatedUser, startupPopup: true, Test: true });
    }

    // If a user is found by facebookid, validate UDID and update
    if (userByFacebook) {
      if (userByFacebook.udid !== udid) {
        return res.json({ success: false, message: "The provided device identifier does not match our records." });
      }
      const [ , [updatedUser]] = await User.update(
        { LoginStatus: true, facebookProfileImageLink: DPLink ? DPLink : `https://wawe-poker-api-handeling-fabddf98b575.herokuapp.com/Assets/ProfileImages/snow_man.png` },
        { where: { udid }, returning: true }
      );
      return res.json({ success: true, user: updatedUser, startupPopup: true });
    }

    // If no user was found by facebookid, check the user by UDID
    if (userByUdid) {
      if (!userByUdid.facebookid) {
        return res.json({ success: false, message: "No Facebook account is linked to this profile.", user: userByUdid });
      } else {
        return res.json({ success: false, message: "The device identifier (UDID) is already associated with a different Facebook account.", user: userByUdid });
      }
    }

    // If neither user is found, create a new user
    const newUser = await User.create({
      name: username,
      facebookid,
      udid,
      facebookProfileImageLink: DPLink ? DPLink : `https://wawe-poker-api-handeling-fabddf98b575.herokuapp.com/Assets/ProfileImages/snow_man.png`,
      LoginStatus: true
    });
    const verifyUrl = `${process.env.BASE_URL}/auth/verify-referral?userId=${newUser.id}`;
      console.log("verifyUrl in phone login:" +verifyUrl)
      return res.json({
        success: true,
        user: newUser,
        startupPopup: false,
        verifyUrl
      });
    
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const facebookLoginVerify = async (req, res) => {
  try {
    const { facebookid, udid, DPLink } = req.body;
    
    // Fetch both records concurrently
    const [userByFacebook, userByUdid] = await Promise.all([
      User.findOne({ where: { facebookid } }),
      User.findOne({ where: { udid } })
    ]);

    // If a user with the provided Facebook ID already exists, abort
    if (userByFacebook) {
      return res.json({ success: false, message:  "An account with this Facebook profile already exists." });
    }
    
    // Ensure a user exists for the provided UDID
    if (!userByUdid) {
      return res.json({ success: false, message: "No user found for the provided device identifier." });
    }
    
    // If the UDID's record already has a different Facebook ID, abort
    if (userByUdid.facebookid && userByUdid.facebookid !== facebookid) {
      return res.json({ success: false, message: "The Facebook account provided does not match the one associated with this device" });
    }
    
    // Update the record with the new Facebook ID and profile image link in one operation
    const [updateCount, updatedUsers] = await User.update(
      {
        facebookid,
        facebookProfileImageLink: DPLink 
          ? DPLink 
          : `https://wawe-poker-api-handeling-fabddf98b575.herokuapp.com/Assets/ProfileImages/snow_man.png`
      },
      { where: { udid }, returning: true }
    );
    
    if (updateCount === 0) {
      return res.json({ success: false, message: "Update failed. No matching user found" });
    }
    
    return res.json({ success: true, user: updatedUsers[0] });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getUserStatus = async (req, res) => {
  try {
    const { phone, email, facebook, udid } = req.body;
    console.log(`phone: ${phone} email: ${email} facebook: ${facebook} udid: ${udid}`);

    // Ensure UDID is provided
    if (!udid) {
      return res.status(400).send(`UDID is required and currently is ${udid}`);
    }

    // Build search conditions only when the provided identifiers match specific bot values
    let conditions = [];
    if (
      email === googleBotIdentifiers.email ||
      email === googleBotIdentifiers.iosemail ||
      facebook === googleBotIdentifiers.facebookId ||
      phone === googleBotIdentifiers.number
    ) {
      if (email && email.trim()) conditions.push({ email });
      if (phone && phone.trim()) conditions.push({ number: phone });
      if (facebook && facebook.trim()) conditions.push({ facebookid: facebook });
    }

    // Launch both queries concurrently
    const [userByIdentifier, userByUdid] = await Promise.all([
      conditions.length > 0
        ? User.findOne({ where: { [Op.or]: conditions } })
        : Promise.resolve(null),
      User.findOne({ where: { udid } })
    ]);

    // If a user is found using identifiers, update login status and return updated record
    if (userByIdentifier) {
      const [updateCount, updatedUsers] = await User.update(
        { LoginStatus: true },
        { where: { id: userByIdentifier.id }, returning: true }
      );
      return res.json({ success: true, user: updatedUsers[0], startupPopup: true, Test: true });
    }

    // If no user was found using identifiers, return the UDID-based result (if any)
    if (userByUdid) {
      return res.json({ success: true, message: "User found", user: userByUdid });
    } else {
      return res.json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const logoutUser = async (req, res) => {
  try {
    const { udid } = req.body;
    // Fetch a single user by UDID (assuming UDID is unique)
    const user = await User.findOne({ where: { udid } });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if the user is one of the special bot users
    const isBotUser =
      user.email === googleBotIdentifiers.email ||
      user.facebookid === googleBotIdentifiers.facebookId ||
      user.number === googleBotIdentifiers.number;

    // Use the primary key update for bot users; otherwise update by UDID
    const updateCondition = isBotUser ? { id: user.id } : { udid };

    // Update LoginStatus in one operation and get the updated record immediately
    const [updateCount, updatedUsers] = await User.update(
      { LoginStatus: false },
      { where: updateCondition, returning: true }
    );

    return res.json({ success: true, message: "User found", user: updatedUsers[0] });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const serverStatus = async (req, res) => {
  try {
    const { platform, version } = req.body;
    console.log(`Platform: ${platform}, Version: ${version}`);

    // Fetch the version record (assumes proper indexing on version and platform)
    const latestVersion = await Version.findOne({
      where: { version, platform },
      raw: true
    });

    if (!latestVersion) {
      return res.status(404).json({ success: false, message: "Version not found" });
    }

    // Only include buttons whose corresponding flags are true
    const btnToDisplay = ['google', 'facebook', 'apple', 'phone'].filter(
      btn => latestVersion[btn] === true
    );

    return res.status(200).json({ success: true, btnToDisplay });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
};


const getCachedImageLinks = async () => {
  const now = Date.now();
  if (cachedImageLinks && (now - lastCacheTime) < cacheTTL) {
    return cachedImageLinks;
  }
  // Read all image files asynchronously
  const files = await fs.readdir(imagesFolder);
  // Filter image files based on allowed extensions
  const imageFiles = files.filter((file) =>
    [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(
      path.extname(file).toLowerCase()
    )
  );
  // Construct image links from the file names
  const imageLinks = imageFiles.map((file) => `${baseURL}${file}`);
  // Update cache
  cachedImageLinks = imageLinks;
  lastCacheTime = now;
  return imageLinks;
};

const getImageLink = async (req, res) => {
  try {
    const { userId } = req.body;

    // Launch both the user query and image link retrieval concurrently
    const [user, imageLinks] = await Promise.all([
      User.findOne({ where: { id: userId } }),
      getCachedImageLinks()
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found for userId: ${userId}`
      });
    }

    return res.json({
      success: true,
      imageLinks,
      googleProfile: user.googleProfileImageLink || null,
      facebookProfile: user.facebookProfileImageLink || null
    });
  } catch (error) {
    console.log("Error processing getImageLink request:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};
const versionStatus = async (req, res) => {
  try {
    const { version, platform } = req.body;
    
    // Query the version record using raw mode for lightweight response
    const versionStatus = await Version.findOne({
      where: { version, platform },
      raw: true,
    });
    
    if (!versionStatus) {
      return res.json({ success: false, message: "Version not found" });
    }
    
    // Map version types to environment configurations
    const envMap = {
      Development: { socket: process.env.Devsocket, api: process.env.DevAPI },
      Staging: { socket: process.env.Stagsocket, api: process.env.StagAPI },
      Production: { socket: process.env.Prodsocket, api: process.env.ProdAPI },
    };
    
    // If the type exists in our mapping, send that configuration
    if (envMap[versionStatus.type]) {
      return res.json({ success: true, message: versionStatus.type, ...envMap[versionStatus.type] });
    } else {
      return res.json({ success: false, message: "Unknown version type" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const buildCodeStatus = async (req, res) => {
  try {
    const { buildno,version, platform } = req.body;
    console.log(`buildno: ${buildno}, version: ${version}, platform: ${platform}`);
    // Query the version record using raw mode for lightweight response
    const versionStatus = await Version.findOne({
      where: { buildno, version, platform },
      raw: true,
    });
    
    if (!versionStatus) {
      return res.json({ success: false, message: "Version not found" });
    }
    
    // Map version types to environment configurations
    const envMap = {
      Development: { socket: process.env.Devsocket, api: process.env.DevAPI },
      Staging: { socket: process.env.Stagsocket, api: process.env.StagAPI },
      Production: { socket: process.env.Prodsocket, api: process.env.ProdAPI },
    };
    
    // If the type exists in our mapping, send that configuration
    if (envMap[versionStatus.type]) {
      return res.json({ success: true, message: versionStatus.type, ...envMap[versionStatus.type] });
    } else {
      return res.json({ success: false, message: "Unknown version type" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAssets = async (req, res) => {
  try {
    const { userId } = req.body;
    //console.log("user id is "+userId)

    const imageLinks = await getCachedImageLinks();

    let googleProfile = null;
    let facebookProfile = null;

    if (userId) {
      const user = await User.findOne({ where: { id: userId } });
      //console.log("user "+user)
      if (user) {
        googleProfile = user.googleProfileImageLink || null;
        facebookProfile = user.facebookProfileImageLink || null;
      }
    }

    return res.json({
      success: true,
      imageLinks,
      googleProfile,
      facebookProfile,
    });

  } catch (error) {
    console.log("API Error: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching avatar images",
    });
  }
}; 

const getPingSettings = async (req, res) => {
  try {
    const current = getSettings();
    return res.json({
      success: true,
      pingInterval: current.pingInterval,
      timeoutThreshold: current.timeoutThreshold,
      maxMissed: current.maxMissed,
      qualityThresholds: current.qualityThresholds
    });
  } catch (error) {
    console.log("API Error: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching ping settings",
    });
  }
};

const updatePingSettings = async (req, res) => {
  try {
    const { pingInterval, timeoutThreshold, maxMissed, qualityThresholds } = req.body;

    const success = updateSettings({ pingInterval, timeoutThreshold, maxMissed, qualityThresholds });

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Invalid qualityThresholds order. Must be: strong < good < normal < bad < disconnected",
      });
    }

    const current = getSettings();

    return res.json({
      success: true,
      message: "Ping settings updated",
      ...current,
    });
  } catch (error) {
    console.log("API Error: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating ping settings",
    });
  }
};

module.exports = {phoneLogin,googleLogin,buildCodeStatus,facebookLogin,getUserStatus,logoutUser,usernameupdate,phoneverify,phoneingameverify,serverStatus,verifyPhone,googleLoginVerify,facebookLoginVerify,getImageLink,versionStatus,getAssets,getPingSettings,updatePingSettings,verifyReferral,verifyFriendInvite}