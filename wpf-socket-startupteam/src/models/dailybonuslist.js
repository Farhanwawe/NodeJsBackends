module.exports = (sequelize, type) => {
    return sequelize.define('dailyBonusList', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      day: type.INTEGER,
      reward__chips: type.INTEGER, 
      reward__spinners: type.INTEGER,
    },{
        Timestamps:true
    })
  };