/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
  return sequelize.define('friendslist', {
    idMyPlayer: {
      type: type.BIGINT,
      //primaryKey: true,
    },
    idOtherPlayer: {
      type: type.BIGINT,
      //primaryKey: true,
    },
    FriendStatus : type.STRING,
    NameMyPlayer : type.STRING,
    NameOtherPlayer : type.STRING,
    OnlineStatus :{type: type.BOOLEAN, defaultValue:"false"},
  })
};
