module.exports = (sequelize, type) => {
    return sequelize.define('levelChallenges', {
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
      points:type.INTEGER,
      level: type.INTEGER,
      lastClaimedlevel: type.INTEGER, 
      lastClaimedAt: type.DATE,
      lastAssignedAt: type.DATE
     
    },{
        Timestamps:true
    })
  };