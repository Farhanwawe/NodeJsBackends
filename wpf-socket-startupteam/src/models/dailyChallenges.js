module.exports = (sequelize, type) => {
    return sequelize.define('dailyChallenges', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: type.STRING,
      description: type.STRING, 
      points : type.INTEGER,
      target : type.INTEGER,
      complexity: type.STRING
     
    },{
        Timestamps:true
    })
  };