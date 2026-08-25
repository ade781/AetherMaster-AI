const { sequelize } = require('../config/database');
const Character = require('./Character');
const Campaign = require('./Campaign');

module.exports = {
  sequelize,
  Character,
  Campaign,
};
