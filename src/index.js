const path = require('path'),
    jsonfile = require('jsonfile'),
    process = require('process'),
    settingsProvider = require('./lib/settings'),
    minimist = require('minimist');

 (async()=>{

    const argv = minimist(process.argv.slice(2)),
        func = process.argv[2]

    settingsProvider.mergeArgs(argv)

    if (argv.version || argv.v){
        const package = jsonfile.readFileSync(path.join( __dirname, '/version.json'))
        console.log(`tetrifact-tools, version ${package.version}`)
        return
    }
    
    if (!func){
        console.error(`error - no function specified. use tetrifact-tools <function> [optional args]`)
        console.log(`Supported functions are [upload|uploadpartial|download|downloadtagged]`)
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

            case 'uploadpartial':{
                const uploadPartial = require('./lib/uploadPartial')
                await uploadPartial()
                break
            }

            default:{  
                if (func)
                    console.log(`"${func}" is not a supported function. `)
                console.log(`Tetrifact tool - supported functions are [upload|download|downloadtagged|uploadpartial]`)
            }
        }
    } catch (ex){
        console.error(ex)
        return process.exit(1)
    }
    
 })()
