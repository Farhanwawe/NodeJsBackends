const { DATE } = require("sequelize");

/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('BonusValues', {
      Id: {
        type: type.BIGINT,
        primaryKey: true,
      },
      InstaFollowAmount : type.INTEGER,
      FacebookFollowAmount: type.INTEGER,
      TwitterFollowAmount: type.INTEGER,
      RateUsAmount: type.INTEGER,
      WelcomeBonus : type.INTEGER,
    })
  };
  