module.exports = (sequelize, type) => {
    return sequelize.define('BetTheFlop', {
      Id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      betType: type.STRING,
      amount: type.INTEGER,
      isActive: type.BOOLEAN,
    })
  };
  