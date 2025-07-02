const process = require('process'), 
    minimist = require('minimist'),
    urljoin = require('urljoin'),
    downloadPackage = require('./downloadPackage'),
    purgePackages = require('./purgePackages'),
    httputils = require('madscience-httputils'),
    settingsProvider = require('./settings'),
    log = require('./log'),
    fs = require('fs-extra'),
    path = require('path')

module.exports = async function(){
    let args = settingsProvider.merge(minimist(process.argv.slice(2))),
        host = args.host,
        store = args.store,
        force = args.force || args.f,
        tag = args.tag,
        packageMetaDataPath = args.metadata

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

    if (!tag){
        log.error('tag not defined. Use --tag <tag>')
        process.exitCode = 1
        return 
    }

    // path will not accept numbers, if latest code happens to be an int
    tag = tag.toString()

    let lookupUrl = urljoin(host, 'v1/packages/latest/', encodeURIComponent(tag)),
        taglookup 
    
    // 
    try {
        taglookup = await httputils.downloadString(lookupUrl)
    } catch (ex){
        if (ex.errno === 'EPROTO')
            log.error(`Error looking up ${lookupUrl}, are you using http instead of https or vice versa?`)
        else
            log.error(ex)

        process.exitCode = 1
        return
    }

    if (taglookup.statusCode === 404){
        log.error(`No packages with tag ${tag} were found`)
        process.exitCode = 1
        return 
    }

    if (taglookup.statusCode !== 200){
        log.error(`Error doing tag request : ${taglookup.body}`)
        process.exitCode = 1
        return 
    }

    const packageInfo = JSON.parse(taglookup.body)
    if (!packageInfo.success){
        log.error(`Error looking up package : ${packageInfo}`)
        process.exitCode = 1
        return 
    }

    if (!packageInfo.success.package){
        log.error(`Couldn't find packages matching tags : ${tag}`)
        process.exitCode = 1
        return
    }


    const extractPath = await downloadPackage(host, store, packageInfo.success.package.id, force)

    await purgePackages(store)

    if (packageMetaDataPath) 
        await fs.outputJson(packageMetaDataPath, { 
            path : path.resolve(extractPath),
            id : packageInfo.id
        })

    console.log(`Package ${packageInfo.success.package.id} available at path ${extractPath}`)
}
