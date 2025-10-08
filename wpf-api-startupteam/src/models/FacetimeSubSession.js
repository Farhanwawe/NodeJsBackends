/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('faceTimeSubSession', {
  id: {
    type: type.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  sessionId: {
    type: type.BIGINT,
    references: {
      model: 'faceTimeSessions',
      key: 'sessionId',
    },
  },
 subTime:type.INTEGER,
 isCompleted:type.BOOLEAN
}, {
  timestamps: true,
      
    })
  };