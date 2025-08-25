const path = require('path'),
    jsonfile = require('jsonfile'),
    process = require('process'),
    settingsProvider = require('./lib/settings'),
    log = require('./lib/log'),
    minimist = require('minimist');

 (async()=>{

    const argv = minimist(process.argv.slice(2)),
        allowedFunctions =  ['download', 'downloadtagged', 'list', 'upload', 'uploadpartial', 'verify'],
        func = process.argv[2]

    settingsProvider.mergeArgs(argv)

    if (argv.version || argv.v){
        const package = jsonfile.readFileSync(path.join( __dirname, '/version.json'))
        console.log(`tetrifact-tools, version ${package.version}`)
        process.exitCode = 0
        return
    }

    if (!func){
        console.log(`No function specified. Use "tetrifact-tools <function> [optional args]"`)
        console.log(`Supported functions are [${allowedFunctions.join('|')}]`)
        process.exitCode = 1
        return
    }
    
    try {
        let command
        switch(func.trim().toLowerCase()){

            case 'download':{
                command = require('./commands/getPackage')
                break
            }
            
            case 'downloadtagged':{
                 command = require('./commands/getLatestPackageWithTag')
                 break
            }        

            case 'list':{
                command = require('./commands/listPackages')
                break
            }

            case 'upload':{
                command = require('./commands/uploadPackage')
                break
            }

            case 'uploadpartial':{
                command = require('./commands/uploadPartial')
                break
            }

            case 'verify':{
                command = require('./commands/verify')
                break
            }
        }

        if (command == null){
            console.log(`"${func}" is not a supported function. `)
            console.log(`Tetrifact tool - supported functions are [${allowedFunctions.join('|')}]`)
        } else {
            await command()
        }

    } catch (ex){
        log.error(ex)
        process.exitCode = 1
    }
    
 })()
