/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('userLog', {
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
      time_spend: type.STRING,
      time_spend_formated: {type: type.STRING},
      session_start: {type: type.DATE},
      session_end: {type: type.DATE},
      
    },{
        timestamps: true
      })
  };
  