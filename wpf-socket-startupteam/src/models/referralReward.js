module.exports = (sequelize, DataTypes) => {
  return sequelize.define("referralReward", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    referralClickId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "referralClicks",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    referrerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    refereeId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    rewardType: {
      type: DataTypes.ENUM('signup', 'purchase', 'game_played', 'custom'),
      allowNull: false,
    },
    referrerReward: {
      type: DataTypes.INTEGER, // No decimals
      allowNull: false,
      defaultValue: 500000,
    },
    refereeReward: {
      type: DataTypes.INTEGER, // No decimals
      allowNull: true,
      defaultValue: 500000,
    },
    referrerRewardStatus: {
      type: DataTypes.ENUM('pending', 'credited', 'used', 'denied'),
      defaultValue: 'pending',
    },
    refereeRewardStatus: {
      type: DataTypes.ENUM('pending', 'credited', 'used', 'denied'),
      defaultValue: 'pending',
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
  }, {
    timestamps: true,
  });
};
