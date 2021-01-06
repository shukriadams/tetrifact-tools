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
        console.error(`error - no function specified. use tetrifact-tools <function> [optional args]`)
        console.log(`Supported functions are [getPackage|getLatestPackageWithTag]`)
        return process.exit(1)
    }

    try {
        switch(func){
            
            case 'getPackage':{
                const getPackage = require('./lib/getPackage')
                await getPackage()
                break
            }

            case 'getLatestPackageWithTag':{
                const getLatestPackageWithTag = require('./lib/getLatestPackageWithTag')
                await getLatestPackageWithTag()
                break
            }

            default:{  
                console.log(`Invalid function "${func}" - supported functions are [getPackage|getLatestPackageWithTag]`)
                process.exit(1)
            }
        }
    } catch (ex){
        console.log(ex)
    }
    
 })()
