/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('slotResult', {
  id: {
    type: type.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: type.INTEGER,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  handName: {
    type: type.STRING,
    allowNull: false,
  },
  reward: {
    type: type.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  lastClaimed:type.DATE
}, {
  timestamps: true,
      
    })
  };
  