module.exports = (sequelize, DataTypes) => {
    return sequelize.define("userSession", {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
      },
      connectionId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      socketKey: {
        type: DataTypes.STRING,
      },
      session_start: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      session_end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING, // active / disconnected / expired
        defaultValue: "active",
      },
    }, {
      timestamps: true,
    });
  };
  