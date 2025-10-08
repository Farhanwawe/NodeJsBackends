/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
    return sequelize.define('Tables', {
  id: {
    type: type.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tableId: type.INTEGER,
  name: type.STRING,
  typeName: type.STRING,
  buyIn: type.STRING,
  max_seats: type.INTEGER,
  minPlayers: type.INTEGER,
  turnCountdown: type.INTEGER,
  minBet: type.INTEGER,
  minimumAmount: type.BIGINT,
  maximumAmount: type.BIGINT,
  afterRoundCountdown: type.INTEGER,
  type: type.STRING,
  sequence: type.INTEGER,
  display: type.BOOLEAN,
  level: type.INTEGER


}, {
  timestamps: true,
      
    })
  };