// const apn = require('apn'); 
// const path = require('path');

// const apnProvider = new apn.Provider({
//   token: {
//     key: path.join(__dirname, 'AuthKey_XXXXXXX.p8'), 
//     keyId: 'YOUR_KEY_ID',
//     teamId: 'YOUR_TEAM_ID'
//   },
//   production: false // true for production
// });

// async function sendToDeviceToken(deviceToken, message, topic) {
//   const note = new apn.Notification({
//     alert: message,
//     payload: { message },
//     topic
//   });

//   try {
//     const result = await apnProvider.send(note, deviceToken);
//     console.log(`APNs: Sent to ${deviceToken}`, result.sent.length ? '✅' : '❌');
//   } catch (err) {
//     console.error('APNs Error:', err);
//   }
// }

// module.exports = sendToDeviceToken;
