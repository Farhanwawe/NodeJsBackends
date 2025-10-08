module.exports = (sequelize, type) => {
    return sequelize.define('Reports', {
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
      ReportedId:{
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      ReportFilter: type.STRING,
      email: type.STRING,
      message: type.STRING,
      assignedUser: type.STRING
    }, {
      timestamps: true
    });
  };