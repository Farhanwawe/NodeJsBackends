module.exports = (sequelize, type) => {
  return sequelize.define('weekly_bonus', {
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
    day: {
      type: type.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    lastClaimed: {
      type: type.DATE,
      allowNull: true
    },
    rewardProgress: { 
      type: type.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    timerActive: { 
      type: type.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    week: { 
      type: type.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    lastClaimedDay: type.INTEGER,
    month: type.INTEGER
  }, {
    timestamps: true
  });
};