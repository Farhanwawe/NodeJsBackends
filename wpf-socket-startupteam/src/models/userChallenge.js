module.exports = (sequelize, type) => {
    return sequelize.define('userChallenges', {
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
      challengeId: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'dailyChallenges',
          key: 'id'
        }
      },
      isCompleted: type.BOOLEAN,
      isCollected: type.BOOLEAN,
      progress: type.INTEGER,
      priority: {
        type: type.INTEGER,
        defaultValue: 0
      }, 
      assignedAt: type.DATE
     
    },{
        Timestamps:true
    })
  };