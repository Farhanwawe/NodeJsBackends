module.exports = (sequelize, type) => {
    return sequelize.define('RewardVIPUser', {
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
      Chips: type.INTEGER,
      Spinner: type.INTEGER,
      isCollected: type.BOOLEAN,
      Image: type.STRING
    }, {
      timestamps: true
    });
  };