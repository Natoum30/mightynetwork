var User = require('../models/User');

module.exports.getByUsername = function (userUsername, callback) {
    User.findOne({
        'username': userUsername
    }, callback)
}