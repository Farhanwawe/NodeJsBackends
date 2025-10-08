/**
 * Notification model for scheduled push notifications
 * Fields:
 * - id (auto)
 * - userId (integer, nullable)
 * - token (string, nullable)
 * - title (string, required)
 * - body (string, required)
 * - notificationType (string, required) - 'me', 'friend', or 'public'
 * - scheduledAt (date, required)
 * - sent (boolean, default false)
 */
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    body: {
      type: DataTypes.STRING,
      allowNull: false
    },
    notificationType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['me', 'friend', 'public']]
      }
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'Notifications'
  });

  return Notification;
};


