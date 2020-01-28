const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../sequelize')

class User extends Model {}
User.init({
  user_id: { type: DataTypes.STRING, primaryKey: true },
  user_name: DataTypes.STRING,
  channel_id: DataTypes.STRING,
  state: DataTypes.BIGINT.UNSIGNED,
  oauthToken: { type: DataTypes.STRING, allowNull: true },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
})

// sync tables with db
sequelize.sync({ match: /isomer_slackbot_credentials$/ })

module.exports = {
  User,
}
