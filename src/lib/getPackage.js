const process = require('process'), 
    minimist = require('minimist'),
    downloadPackage = require('./downloadPackage'),
    settingsProvider = require('./settings'),
    purgePackages = require('./purgePackages')

module.exports = async function(){
    const args = settingsProvider.merge(minimist(process.argv.slice(2))),
        host = args.host,
        maxPackages = args.maxPackages || 2,
        store = args.store,
        pkg = args.package

    if (!host){
        console.error('ERROR : host not defined. Use --host <host>')
        return process.exit(1)
    }

    if (!store){
        console.error('ERROR : store not defined. Use --store <store>')
        return process.exit(1)
    }

    const tmphost = host.toLowerCase()
    if (!tmphost.startsWith('http://') && !tmphost.startsWith('https://')){
        console.error('ERROR : host malformed, must start with http:// or https://')
        return process.exit(1)
    }


    if (!pkg){
        console.error('ERROR : package not defined. Use --package <package>')
        return process.exit(1)
    }

    const extractPath = await downloadPackage(host, store, pkg.toString())
    await purgePackages(store, maxPackages)

    console.log(`Package ${pkg} available at path ${extractPath}`)
}
