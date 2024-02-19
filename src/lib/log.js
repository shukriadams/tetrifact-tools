let winstonWrapper = require('winston-wrapper'),
    settings = require('./settings').get(),
    log = winstonWrapper.new(settings.logDir, settings.logLevel).log

module.exports = log