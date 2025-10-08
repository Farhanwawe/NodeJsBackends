/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('customNotifications', {
      NotificationID: {
        type: type.BIGINT,
        //primaryKey: true,
      },
      PlayerID: {
        type: type.BIGINT,
        //primaryKey: true,
      },
      Title : type.STRING,
      Description : type.STRING,
      NotificationType : type.STRING,
      money: type.NUMERIC,
    })
  };
  