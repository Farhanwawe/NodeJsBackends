module.exports = (sequelize, DataTypes) => {
    return sequelize.define("referralClick", {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      referralId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "referrals",
          key: "id",
        },
      },
      deviceHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      os: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      browser: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      converted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      friendsMade: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      convertedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      convertedUserId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      fraudScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    }, {
      timestamps: true,
    });
  };
  