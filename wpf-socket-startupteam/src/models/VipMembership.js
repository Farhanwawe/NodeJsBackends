/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('VipMembership', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      Name: type.STRING,
      RequiredPoints:type.INTEGER,
      purchaseBonus:type.INTEGER,
      level: type.INTEGER,
      
    },{
        timestamps: true
      })
  };
  