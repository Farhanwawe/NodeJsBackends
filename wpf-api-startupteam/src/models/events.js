module.exports = (sequelize, type) => {
    return sequelize.define('events', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: type.STRING,
      currency: type.STRING, 
     
    })
  };