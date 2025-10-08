module.exports = (sequelize, type) => {
    return sequelize.define('inAppPurchase', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      productID: type.STRING,
      productPrice: type.STRING,
      hasClaimedFreeProduct: { type: type.BOOLEAN, defaultValue: false },
    }, {
      timestamps: true
    });
  };