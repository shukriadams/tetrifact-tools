const path = require('path'),
    jsonfile = require('jsonfile'),
    process = require('process'),
    settingsProvider = require('./lib/settings'),
    log = require('./lib/log')
    minimist = require('minimist');

 (async()=>{

    const argv = minimist(process.argv.slice(2)),
        allowedFunctions =  ['upload', 'download','downloadtagged', 'uploadpartial', 'verify'],
        func = process.argv[2]

    settingsProvider.mergeArgs(argv)

    if (argv.version || argv.v){
        const package = jsonfile.readFileSync(path.join( __dirname, '/version.json'))
        console.log(`tetrifact-tools, version ${package.version}`)
        process.exitCode = 0
        return
    }

    if (!func){
        console.log(`error - no function specified. use tetrifact-tools <function> [optional args]`)
        console.log(`Supported functions are [${allowedFunctions.join('|')}]`)
        process.exitCode = 1
        return
    }
    
    try {
        switch(func.trim().toLowerCase()){
            
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

            case 'verify':{
                const verify = require('./lib/verify')
                await verify()
                break
            }

            case 'uploadpartial':{
                const uploadPartial = require('./lib/uploadPartial')
                await uploadPartial()
                break
            }

            default:{  
                if (func)
                    console.log(`"${func}" is not a supported function. `)
                console.log(`Tetrifact tool - supported functions are [${allowedFunctions.join('|')}]`)
            }
        }
        
    } catch (ex){
        log.error(ex)
        process.exitCode = 1
    }
    
 })()
