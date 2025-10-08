module.exports = (sequelize, type) => {
    return sequelize.define('RewardChallenges', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      level:type.INTEGER,
      points: type.INTEGER,
      normalReward:type.STRING,
      normalRewardint:type.INTEGER,
      subscribedReward:type.STRING,
      subscribedRewardint:type.INTEGER,
      tag:type.STRING
    },{
        Timestamps:true
    })
  };