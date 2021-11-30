const process = require('process'), 
    minimist = require('minimist'),
    urljoin = require('urljoin'),
    downloadPackage = require('./downloadPackage'),
    purgePackages = require('./purgePackages'),
    httputils = require('madscience-httputils'),
    settingsProvider = require('./settings'),
    fs = require('fs-extra'),
    path = require('path')

module.exports = async function(){
    let argv = settingsProvider.merge(minimist(process.argv.slice(2))),
        host = argv.host,
        store = argv.store,
        force = args.force || args.f,
        tag = argv.tag,
        packageMetaDataPath = argv.metadata

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

    if (!tag){
        console.error('ERROR : tag not defined. Use --tag <tag>')
        return process.exit(1)
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
            console.log(`Error looking up ${lookupUrl}, are you using http instead of https or vice versa?`)
        else
            console.log(ex)

        return process.exit(1)
    }

    if (taglookup.statusCode === 404){
        console.log(`No packages with tag ${tag} were found`)
        return process.exit(1)
    }

    if (taglookup.statusCode !== 200){
        console.log(`Error doing tag request : ${taglookup.body}`)
        return process.exit(1)
    }

    const packageInfo = JSON.parse(taglookup.body)
    if (!packageInfo.success){
        console.log(`Error looking up package : ${packageInfo}`)
        return process.exit(1)
    }

    if (!packageInfo.success.package){
        console.log(`Couldn't find packages matching tags : ${tag}`)
        return process.exit(1)
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
