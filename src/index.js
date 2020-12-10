const path = require('path'),
    jsonfile = require('jsonfile'),
    process = require('process'),
    minimist = require('minimist'),
    argv = minimist(process.argv.slice(2))

if (argv.version || argv.v){
    const package = jsonfile.readFileSync(path.join( __dirname, '/version.json'))
    console.log(`tetrifact-tools, version ${package.version}`)
    return process.exit(0)
}
    
