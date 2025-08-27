const process = require('process'), 
    minimist = require('minimist'),
    downloadPackage = require('./../lib/downloadPackage'),
    settingsProvider = require('./../lib/settings'),
    log = require('./../lib/log'),
    purgePackages = require('./../lib/purgePackages')

module.exports = async function(){
    const args = settingsProvider.merge(minimist(process.argv.slice(2))),
        host = args.host,
        store = args.store,
        ticket = args.ticket,
        force = args.force || args.f,
        wait = args.wait || args.w,
        pkg = args.package

    if (!host){
        log.error('host not defined. Use --host <host>')
        process.exitCode = 1
        return 
    }

    if (!store){
        log.error('store not defined. Use --store <store>')
        process.exitCode = 1
        return
    }

    const tmphost = host.toLowerCase()
    if (!tmphost.startsWith('http://') && !tmphost.startsWith('https://')){
        log.error('host malformed, must start with http:// or https://')
        process.exitCode = 1
        return 
    }

    if (!pkg){
        log.error('package not defined. Use --package <package>')
        process.exitCode = 1
        return
    }

    const extractPath = await downloadPackage(host, store, pkg.toString(), ticket,  wait, force)
    // if extractPath is null package download failed, do nothing, else purge + report path
    if (extractPath){
        await purgePackages(store)
        log.info(`Package ${pkg} available at path ${extractPath}`)
    }  
}
