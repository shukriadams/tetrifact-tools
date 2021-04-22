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
        console.log(`Supported functions are [upload|download|downloadtagged]`)
        return process.exit(1)
    }

    
    try {
        switch(func.toLowerCase()){
            
            case 'download':{
                const getPackage = require('./lib/getPackage')
                await getPackage()
                break
            }
            case 'downloadtagged':{
                const getPackage = require('./lib/getLatestPackageWithTag')
                await getPackage()
                break
            }        

            case 'upload':{
                const uploadPackage = require('./lib/uploadPackage')
                await uploadPackage()
                break
            }

            default:{  
                if (func)
                    console.log(`"${func}" is not a supported function. `)
                console.log(`Tetrifact tool - supported functions are [upload|download|downloadtagged]`)
            }
        }
    } catch (ex){
        console.error(`${ex}`)
    }
    
 })()
