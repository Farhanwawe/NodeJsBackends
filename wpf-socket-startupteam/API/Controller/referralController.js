const referralService = require('../../src/services/referralService');
const { detect } = require('detect-browser');
const crypto = require('crypto');
const { Op } = require('sequelize');
const {Referral,ReferralClick,Device} = require('../../src/database/sequelize');

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
      res.json({
        code: referral.code,
        link: `${process.env.BASE_URL}/deeplink?ref=${referral.code}`,
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
      const iosUrl = `https://wpf-api-startupteam-335ac6818679.herokuapp.com://deeplink?ref=${referralCode}`;
      const androidPlayStoreUrl = `https://play.google.com/store/apps/details?id=com.wawe.PokerFace&referrer=${referralCode}`;
      const iosAppStoreUrl = `https://apps.apple.com/us/app/your-app/id123456789?ref=${referralCode}`;
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
      res.json({
        code: referral.code,
        link: `${process.env.BASE_URL}/deeplink/invite?friend=${referral.code}`,
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
      const iosUrl = `https://wpf-api-startupteam-335ac6818679.herokuapp.com://deeplink?ref=${referralCode}`;
      const androidPlayStoreUrl = `https://play.google.com/store/apps/details?id=com.wawe.PokerFace&referrer=${referralCode}`;
      const iosAppStoreUrl = `https://apps.apple.com/us/app/your-app/id123456789?ref=${referralCode}`;
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
