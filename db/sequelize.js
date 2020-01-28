const { dbConfig } = require('./dbconfig')
const { Sequelize } = require('sequelize')

const models = require('./models')

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.user,
  dbConfig.password,
  {
    dialect: 'postgres',
    port: parseInt(dbConfig.port, 10),
    host: dbConfig.host,
    models: Object.values(models),
    // eslint-disable-next-line no-console
    logging: (...msg) => console.log(msg),
  }
)

module.exports = {
  sequelize,
}
