module.exports = (sequelize, DataTypes) => {
  return sequelize.define("referral", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    referrerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    code: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
    },
    campaign: {
      type: DataTypes.STRING(32),
      defaultValue: "default",
    },
    expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'paused', 'expired'),
      defaultValue: "active",
    },
    clickCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    conversionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    timestamps: true
  });
};
