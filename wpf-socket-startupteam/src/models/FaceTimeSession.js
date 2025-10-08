/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('faceTimeSessions', {
  sessionId: {
    type: type.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: type.BIGINT,
    references: {
      model: 'users',
      key: 'id',
    },
  },
 level:type.STRING,
 totalTime:type.INTEGER,
 isCompleted:type.BOOLEAN
}, {
  timestamps: true,
      
    })
  };