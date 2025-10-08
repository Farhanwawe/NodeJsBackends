const { DATE } = require("sequelize");

/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('Gifts', {
      GiftId: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      GiftName: type.STRING,
      GiftPrice: type.INTEGER,
      Enabled : type.BOOLEAN,
      ImageURL : type.STRING
    })
  };
  