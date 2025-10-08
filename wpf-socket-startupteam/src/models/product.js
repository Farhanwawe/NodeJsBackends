module.exports = (sequelize, type) => {
    return sequelize.define('InappProducts', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      productname: type.STRING,
      product_ID: type.STRING,
      productPrice: type.INTEGER,
      lastPrice: type.INTEGER,
      lastChips: type.INTEGER,
      chips: type.INTEGER,
      spinner: type.INTEGER,
      relatedFreeProductId: type.BIGINT
    })
  };