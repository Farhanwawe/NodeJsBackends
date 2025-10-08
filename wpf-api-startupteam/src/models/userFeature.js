module.exports = (sequelize, type) => {
  return sequelize.define('userFeature', {
    id: {
      type: type.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    firebaseToken: {
      type: type.STRING,
      allowNull: false
    },
    userId: {
      type: type.BIGINT,
      allowNull: false,
    }
  });
};