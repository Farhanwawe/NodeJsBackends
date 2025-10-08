module.exports = (sequelize, type) => {
    return sequelize.define('ReportTable', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      reportId: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'Reports',
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