module.exports = (sequelize, type) => {
    return sequelize.define('QueryTable', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      QuerytId: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'handleQueries',
          key: 'id'
        }
      },
      AssigneeId: {
        type: type.BIGINT,
        references: {
          model: 'vipAdmin',
          key: 'id'
        },
      },
      AssignedBy:type.STRING,
      status: type.STRING,
      AssignedAt: type.DATE,
      closedAt: type.DATE,
      conclusion: type.STRING,
      version: type.INTEGER
     
    },{
        Timestamps:true
    })
  };