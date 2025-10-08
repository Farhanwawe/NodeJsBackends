/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('vipAdmin', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: type.STRING,
      email: type.STRING,
      phone: type.STRING,
      password: type.STRING,
      role: type.STRING
     
    })
  };
  