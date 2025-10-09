const Sequelize = require('sequelize');
const dotEnv = require('dotenv');
const config = require('../../config');
const initializeModels = require('./models');
const setupAssociations = require('./associations');

dotEnv.config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    pool: {
      max: 10,
      min: 0,
      idle: 10000,
      acquire: 30000,
    },
    logging: config.sequelize.logging ? console.log : false,
  }
);

const models = initializeModels(sequelize, Sequelize);

setupAssociations(models);

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    return sequelize.sync();
  })
  .then(() => {
    console.log('Database synchronized');
  })
  .catch((err) => {
    console.error('Database error:', err);
    process.exit(1);
  });

module.exports = {
  sequelize,
  ...models,
};
