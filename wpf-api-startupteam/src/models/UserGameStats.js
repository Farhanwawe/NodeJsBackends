const { DATE } = require("sequelize");

/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('UserGameStats', {
      PlayerId: {
        type: type.BIGINT,
        primaryKey: true,
      },
      NormalSpinnerLastTime: type.DATE,
      PurchaseSpinnerLastTime: type.DATE,
      totalXP : type.INTEGER,
      SpinnerInfo : type.INTEGER,
      XPNextLevel : type.INTEGER,
      XPPrevLevel : type.INTEGER,
    })
  };
  