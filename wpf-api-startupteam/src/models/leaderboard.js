module.exports = (sequelize, type) => {
    return sequelize.define('leaderBoards', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      LBID: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'leaderboardEvents',
          key: 'id'
        }},
      userId: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      playerName: type.STRING,
      objectsCollected: type.INTEGER,
      reward:type.STRING,
      isCollected: {
        type: type.BOOLEAN,
        defaultValue: false
      }
    }, {
      timestamps: true
    });
  };