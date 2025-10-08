module.exports = (sequelize, type) => {
    return sequelize.define('popups', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: type.STRING,
      Rewards: type.INTEGER, 
      DontReward: type.INTEGER,
      isVisible: type.BOOLEAN,
      Priorty: type.INTEGER,
      Android: type.BOOLEAN,
      IPhonePlayer: type.BOOLEAN,
      
     
    })
  };