const process = require('process')


module.exports = {

    // Writes to console on a single line
    log(msg){
        process.stdout.write(`${msg}`.padEnd(50) + '\x1b[0G')
    }
}