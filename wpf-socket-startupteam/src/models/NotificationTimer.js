/**
 * NotificationTimer model for storing notification timing configuration
 * Fields:
 * - id (auto)
 * - engagementTime (bigint) - Time in milliseconds for engagement notifications
 * - offlineUserTime (bigint) - Time in milliseconds for offline user notifications
 * - checkingTime (bigint) - Time in milliseconds for how often to check database for inactive users
 * - createdAt (date, auto)
 * - updatedAt (date, auto)
 */
module.exports = (sequelize, DataTypes) => {
  const NotificationTimer = sequelize.define('NotificationTimer', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    engagementTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
      comment: 'Time in milliseconds for engagement notifications'
    },
    offlineUserTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 36 * 60 * 60 * 1000, // 36 hours in milliseconds
      comment: 'Time in milliseconds for offline user notifications'
    },
    checkingTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
      comment: 'Time in milliseconds for how often to check database for inactive users'
    }
  }, {
    tableName: 'NotificationTimers',
    timestamps: true
  });

  return NotificationTimer;
};
