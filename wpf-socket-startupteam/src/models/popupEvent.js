module.exports = (sequelize, type) => {
    return sequelize.define('popupEvent', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: type.STRING,
      startTime: type.DATE,
      endTime: type.DATE,
      isActive: type.BOOLEAN
     
    })
  };