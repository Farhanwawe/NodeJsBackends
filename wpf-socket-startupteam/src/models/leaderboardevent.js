module.exports = (sequelize, type) => {
    return sequelize.define('leaderboardEvent', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      eventId: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id'
        }
      },
      startTime: type.DATE,
      endTime: type.DATE,
      isActive: type.BOOLEAN,
      notifyevent: {
        type: type.BOOLEAN,
        defaultValue: false
      }
     
    })
  };