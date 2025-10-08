const referralService = require('../../src/services/referralService');
const { detect } = require('detect-browser');
const crypto = require('crypto');
const { Op } = require('sequelize');
const {Referral,ReferralClick,Device} = require('../../src/database/sequelize');
const axios = require('axios');

async function shortenBaseUrl(fullUrl) {
  try {
    const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`);
    return res.data;
  } catch (err) {
    console.error('TinyURL error:', err.message);
    return fullUrl; // fallback
  }
}


//encode/decode algo for url encryption
const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_SECRET || '12345678901234567890123456789012'); // 32 bytes
const IV_LENGTH = 16;

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-') // URL-safe
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4 !== 0) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString();
}

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const encryptedData = `${iv.toString('hex')}:${encrypted}`;
  return base64UrlEncode(encryptedData); // make URL-safe
}

function decrypt(encryptedData) {
  const raw = base64UrlDecode(encryptedData);
  const parts = raw.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function shortenBaseUrl(fullUrl) {
  try {
    const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`);
    return res.data;
  } catch (err) {
    console.error('TinyURL error:', err.message);
    return fullUrl; // fallback
  }
}


class ReferralController {
  constructor() {
    this.generateCode = this.generateCode.bind(this);
    this.handleRedirect = this.handleRedirect.bind(this);
    this.generateCodeForFriend = this.generateCodeForFriend.bind(this);
    this.handleRedirectForFriend = this.handleRedirectForFriend.bind(this);
  }
//for ref
async generateCode(req, res) {
  try {
    const campaign = "inGame";
    console.log("hit on generateCode");

    const referral = await referralService.generateCode(req.body.userId, campaign);
    const fullLink = `${process.env.BASE_URL}/deeplink?ref=${referral.code}`;
    const shortenedLink = await shortenBaseUrl(fullLink); // ✅ TinyURL applied

    res.json({
      code: referral.code,
      link: shortenedLink,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

  async handleRedirect(req, res) {
    try {
      console.log("in handle redirect start");
  
      const ref = req.query.ref;
      console.log("Referral code is " + ref);
      
      const code = ref;
      const referral = await Referral.findOne({ where: { code } });
      if (!referral) throw new Error('Referral code not found');
  
      const referrerId = referral.referrerId;
      const referralId = referral.id;
      const browser = detect(req.headers['user-agent']);
      // Generate or reuse cookie-based deviceId
      let deviceId = req.cookies.deviceId;

      if (!deviceId) {
        deviceId = require('crypto').randomUUID();
        res.cookie('deviceId', deviceId, {
         maxAge: 1000 * 60 * 60 * 24, // 1 day
         httpOnly: true,
         sameSite: 'Lax',
         secure: false, // change to true if you're using HTTPS
      });
        console.log("New cookie 'deviceId' set:", deviceId);
      } else {
          console.log("Existing cookie 'deviceId' found:", deviceId);
      }
      const deviceHash = this._hashDevice(req, deviceId);

      const trackingData = {
        deviceHash: deviceHash,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        os: browser?.os,
        browser: browser?.name,
        deviceType: this._getDeviceType(req),
        referrerId,
        referralId
      };
  
      // Track the click
      await referralService.trackClick(ref, trackingData);
      console.log("trackClick point reached now moving to deeplink creation");
  
      const userAgent = (req.headers['user-agent'] || '').toLowerCase();
      const isAndroid = userAgent.includes('android');
      const isIOS = userAgent.includes('iphone') || userAgent.includes('ipad');
  
      // Encode the referral code
      const referralCode = encodeURIComponent(ref);
  
      // Define the URLs for Android, iOS, and Web
      const androidUrl = `wawepokerface://deeplink?${referralCode}`;
      //const iosUrl = `https://wpf-api-startupteam-335ac6818679.herokuapp.com://deeplink?ref=${referralCode}`;
      const iosUrl = `wawepokerface://deeplink?${referralCode}`;
      const androidPlayStoreUrl = `https://play.google.com/store/apps/details?id=com.wawe.PokerFace&referrer=${referralCode}`;
      const iosAppStoreUrl = `https://apps.apple.com/pk/app/wawe-poker-face-holdem-poker/id6450933473?ref=${referralCode}`;
      const webUrl = `https://www.wawepokerface.com/index.php?code=${referralCode}`;
  
      // Choose the fallback URL based on device type
      let fallbackUrl = isAndroid ? androidPlayStoreUrl : isIOS ? iosAppStoreUrl : webUrl;
  
      // Redirect URL is the deep link first, with a fallback to the app store if not installed
      const intentUrl = isAndroid ? androidUrl : isIOS ? iosUrl : webUrl;
  
      console.log("Final redirect URL:", intentUrl);
  
      // Send HTML response for redirecting
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Redirecting...</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta http-equiv="refresh" content="5; url=${fallbackUrl}" />
            <script>
              const fallback = "${fallbackUrl}";
              const intentLink = "${intentUrl}";
              const isAndroid = ${isAndroid};
              const isIOS = ${isIOS};
  
              if (isAndroid) {
                window.location.href = intentLink;
                setTimeout(() => {
                  window.location.href = fallback;
                }, 5000);
              } else if (isIOS) {
                window.location.href = fallback;
              } else {
                window.location.href = fallback;
              }
            </script>
          </head>
          <body>
            <p>Redirecting to app or store...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Referral redirect error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  //for ref ends ehre

  //for friend invite
  async generateCodeForFriend(req, res) {
    try {
      const campaign = "inGame";
      console.log("hit on generateCodeForFriend");
  
      const referral = await referralService.generateCode(req.body.userId, campaign);
      const fullLink = `${process.env.BASE_URL}/deeplink/invite?friend=${referral.code}`;
      const shortenedLink = await shortenBaseUrl(fullLink); // hiding BASE_URL
  
      res.json({
        code: referral.code,
        link: shortenedLink,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async handleRedirectForFriend(req, res) {
    try {
      console.log("in handleRedirectForFriend start");
  
      const ref = req.query.friend;
      console.log("Friend referral code is " + ref);
      
      const code = ref;
      const referral = await Referral.findOne({ where: { code } });
      if (!referral) throw new Error('Friend referral code not found');
  
      const referrerId = referral.referrerId;
      const referralId = referral.id;
      const browser = detect(req.headers['user-agent']);
      // Generate or reuse cookie-based deviceId
      let deviceId = req.cookies.deviceId;

      if (!deviceId) {
        deviceId = require('crypto').randomUUID();
        res.cookie('deviceId', deviceId, {
         maxAge: 1000 * 60 * 60 * 24, // 1 day
         httpOnly: true,
         sameSite: 'Lax',
         secure: false, // change to true if you're using HTTPS
      });
        console.log("New cookie 'deviceId' set:", deviceId);
      } else {
          console.log("Existing cookie 'deviceId' found:", deviceId);
      }
      const deviceHash = this._hashDevice(req, deviceId);

      const trackingData = {
        deviceHash: deviceHash,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        os: browser?.os,
        browser: browser?.name,
        deviceType: this._getDeviceType(req),
        referrerId,
        referralId
      };
  
      // Track the click
      await referralService.trackClick(ref, trackingData);
      console.log("trackClick point reached now moving to deeplink creation for friend");
  
      const userAgent = (req.headers['user-agent'] || '').toLowerCase();
      const isAndroid = userAgent.includes('android');
      const isIOS = userAgent.includes('iphone') || userAgent.includes('ipad');
  
      // Encode the referral code
      const referralCode = encodeURIComponent(ref);
  
      // Define the URLs for Android, iOS, and Web
      const androidUrl = `wawepokerface://deeplink/friend`;
      //const iosUrl = `https://wpf-api-startupteam-335ac6818679.herokuapp.com://deeplink?ref=${referralCode}`;
      const iosUrl = `wawepokerface://deeplink/friend`;
      const androidPlayStoreUrl = `https://play.google.com/store/apps/details?id=com.wawe.PokerFace&referrer=${referralCode}`;
      const iosAppStoreUrl = `https://apps.apple.com/pk/app/wawe-poker-face-holdem-poker/id6450933473?ref=${referralCode}`;
      const webUrl = `https://www.wawepokerface.com/index.php?code=${referralCode}`;
  
      // Choose the fallback URL based on device type
      let fallbackUrl = isAndroid ? androidPlayStoreUrl : isIOS ? iosAppStoreUrl : webUrl;
  
      // Redirect URL is the deep link first, with a fallback to the app store if not installed
      const intentUrl = isAndroid ? androidUrl : isIOS ? iosUrl : webUrl;
  
      console.log("Final redirect URL for friend invite:", intentUrl);
  
      // Send HTML response for redirecting
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Redirecting...</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta http-equiv="refresh" content="5; url=${fallbackUrl}" />
            <script>
              const fallback = "${fallbackUrl}";
              const intentLink = "${intentUrl}";
              const isAndroid = ${isAndroid};
              const isIOS = ${isIOS};
  
              if (isAndroid) {
                window.location.href = intentLink;
                setTimeout(() => {
                  window.location.href = fallback;
                }, 5000);
              } else if (isIOS) {
                window.location.href = fallback;
              } else {
                window.location.href = fallback;
              }
            </script>
          </head>
          <body>
            <p>Redirecting to app or store...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Referral redirect error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  // For table invite and join
  async generateCodeForTable(req, res) {
    try {
      const tableId = req.body.tableId;
      const holdemType = req.body.holdemType;
  
      console.log("table id is :" + tableId);
      console.log("hit on generateCodeForTable");
  
      const payload = JSON.stringify({ tableId, holdemType });
      const encryptedData = encrypt(payload); 
  
      const fullLink = `${process.env.BASE_URL}/deeplink/room?data=${encryptedData}`;
      const shortenedLink = await shortenBaseUrl(fullLink); // the real BASE_URL
  
      res.json({
        link: shortenedLink,
      });
  
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  

async  handleRedirectForTable(req, res) {
  try {
    const encryptedData = req.query.data;
    if (!encryptedData) return res.status(400).send("Missing encrypted data in query.");

    // Step 1: Decrypt incoming data
    const decrypted = decrypt(encryptedData);
    const { tableId, holdemType } = JSON.parse(decrypted);

    console.log("Decrypted tableId:", tableId, "holdemType:", holdemType);
    if (!tableId && tableId !== 0 || !holdemType && holdemType !== 0)
      return res.status(400).send("Invalid decrypted data.");

    // Step 2: Re-encrypt payload
    const reEncryptedPayload = encrypt(JSON.stringify({ tableId, holdemType }));

    // Platform detection
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isAndroid = userAgent.includes('android');
    const isIOS = userAgent.includes('iphone') || userAgent.includes('ipad');

    // Deep link and fallback
    const queryParams = `data=${reEncryptedPayload}`;
    const androidUrl = `wawepokerface://deeplink/room?${queryParams}`;
    const iosUrl = `wawepokerface://deeplink/room?${queryParams}`;
    //const iosUrl = `https://wpf-api-startupteam-335ac6818679.herokuapp.com://deeplink?${queryParams}`;

    const webUrl = `https://www.wawepokerface.com/index.php?${queryParams}`;
    const fallbackUrl = isAndroid
      ? `https://play.google.com/store/apps/details?id=com.wawe.PokerFace`
      : isIOS
        ? `https://apps.apple.com/pk/app/wawe-poker-face-holdem-poker/id6450933473`
        : webUrl;

    const intentUrl = isAndroid ? androidUrl : isIOS ? iosUrl : webUrl;

    console.log("Redirecting to:", intentUrl);

    // Step 3: Redirect HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta http-equiv="refresh" content="5; url=${fallbackUrl}" />
          <script>
            const intentLink = "${intentUrl}";
            const fallback = "${fallbackUrl}";
            const isAndroid = ${isAndroid};
            const isIOS = ${isIOS};

            if (isAndroid) {
              window.location.href = intentLink;
              setTimeout(() => {
                window.location.href = fallback;
              }, 5000);
            } else {
              window.location.href = fallback;
            }
          </script>
        </head>
        <body>
          <p>Redirecting to app or store...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).send("An error occurred during redirection.");
  }
}
    
  _hashDevice = (req, deviceIdFromSet = null) => {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const deviceId = deviceIdFromSet || req.cookies.deviceId || '';
    console.log("hash function called in refController, deviceId cookie is: "+deviceId)
    const components = [userAgent, acceptLanguage, deviceId];
    return require('crypto').createHash('sha256').update(components.join('|')).digest('hex');
  };
  
  
  
  

  _getAppStoreUrl(req) {
    const isIOS = /iPhone|iPad|iPod/i.test(req.headers['user-agent']);
    return isIOS 
      ? process.env.IOS_APP_STORE_URL 
      : process.env.ANDROID_APP_STORE_URL;
  }

  _getDeviceType(req) {
    const ua = req.headers['user-agent'];
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }
}

module.exports = new ReferralController();
