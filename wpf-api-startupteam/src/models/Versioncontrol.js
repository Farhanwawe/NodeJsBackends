
module.exports = (sequelize, type) => {
    return sequelize.define('version', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      version: type.STRING,
      buildno: type.STRING,
      type: type.STRING,
      platform: type.STRING,
      facebook: type.BOOLEAN,
      google: type.BOOLEAN,
      phone: type.BOOLEAN,
      apple: type.BOOLEAN
    })
  };
  