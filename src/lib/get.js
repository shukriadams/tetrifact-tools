const process = require('process'), 
    minimist = require('minimist')

module.exports = async function(){
    const argv = minimist(process.argv.slice(2))
    console.log('getting ...', argv)    
}
