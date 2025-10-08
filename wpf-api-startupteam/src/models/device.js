module.exports = (sequelize, DataTypes) => {
    return sequelize.define("device", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      deviceHash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      deviceType: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      os: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      osVersion: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      manufacturer: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      model: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      isBlacklisted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      blacklistReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      referralCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastActivity: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    }, {
      timestamps: true
      
    });
  };