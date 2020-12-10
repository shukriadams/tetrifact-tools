const path = require('path'),
    jsonfile = require('jsonfile'),
    process = require('process'),
    minimist = require('minimist');

 (async function(){

    const argv = minimist(process.argv.slice(2)),
        func = process.argv[2]

    if (argv.version || argv.v){
        const package = jsonfile.readFileSync(path.join( __dirname, '/version.json'))
        console.log(`tetrifact-tools, version ${package.version}`)
        return process.exit(0)
    }
    
    if (!func){
        console.error(`error - no function specified. use tetrifact-tools <function> [--optional args]`)
        return process.exit(1)
    }
    
    switch(func){
        case 'get':{
            const get = require('./lib/get')
            await get()
            break
        }
        default:{  
            console.log(`Invalid function "${func}" - supported functions are [get]`)
            process.exit(1)
        }
    }
    
 })()
