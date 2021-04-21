const { Model, DataTypes } = require('sequelize')
const sequelize = require('../db.js')
const User = require('../models/User.js')

class Tweet extends Model {}
Tweet.init({
    content: DataTypes.STRING,
    username: DataTypes.STRING,
    timeCreated: DataTypes.DATE
}, { sequelize});

User.hasMany(Tweet);
Tweet.belongsTo(User);

(async ()=>{
    await sequelize.sync()
})()

module.exports = Tweet;