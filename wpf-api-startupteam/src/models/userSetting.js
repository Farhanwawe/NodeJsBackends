/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('usersettings', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      music: type.BOOLEAN,
      sound:type.BOOLEAN,
      vibration:type.BOOLEAN,
      autoRebuy: type.BOOLEAN,
      
    },{
        timestamps: true
      })
  };
  