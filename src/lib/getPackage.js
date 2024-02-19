const process = require('process'), 
    minimist = require('minimist'),
    downloadPackage = require('./downloadPackage'),
    settingsProvider = require('./settings'),
    purgePackages = require('./purgePackages')

module.exports = async function(){
    const args = settingsProvider.merge(minimist(process.argv.slice(2))),
        host = args.host,
        store = args.store,
        force = args.force || args.f,
        pkg = args.package

    if (!host){
        console.error('ERROR : host not defined. Use --host <host>')
        process.exitCode = 1
        return 
    }

    if (!store){
        console.error('ERROR : store not defined. Use --store <store>')
        process.exitCode = 1
        return
    }

    const tmphost = host.toLowerCase()
    if (!tmphost.startsWith('http://') && !tmphost.startsWith('https://')){
        console.error('ERROR : host malformed, must start with http:// or https://')
        process.exitCode = 1
        return 
    }


    if (!pkg){
        console.error('ERROR : package not defined. Use --package <package>')
        process.exitCode = 1
        return
    }

    const extractPath = await downloadPackage(host, store, pkg.toString(), force)
    await purgePackages(store)

    console.log(`Package ${pkg} available at path ${extractPath}`)
}
