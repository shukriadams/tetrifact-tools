const process = require('process')

module.exports = {
    log(msg){
        process.stdout.write(`${msg}`.padEnd(50) + '\x1b[0G')
    }
}