// const sendToDeviceToken = require('./apnProvider');
// const {User} = require('../database/sequelize');

// async function toUser(userId, message) {
//   const user = await User.findByPk(userId);

//   if (!user || !user.apns_device_token) {
//     console.warn(`No device token for user ${userId}`);
//     return;
//   }

//   await sendToDeviceToken(user.apns_device_token, message, user.apns_topic || 'com.yourcompany.pokerface');
// }

// module.exports = {
//   toUser
// };
