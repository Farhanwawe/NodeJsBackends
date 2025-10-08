module.exports = (sequelize, type) => {
    return sequelize.define('handleQueries', {
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
      fullname: type.STRING,
      email: type.STRING,
      phone: type.STRING,
      message: type.STRING,
      assignedUser: type.STRING
    }, {
      timestamps: true
    });
  };