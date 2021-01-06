const process = require('process'), 
    minimist = require('minimist'),
    urljoin = require('urljoin'),
    downloadPackage = require('./downloadPackage'),
    purgePackages = require('./purgePackages'),
    httputils = require('madscience-httputils'),
    fs = require('fs-extra'),
    path = require('path')

module.exports = async function(){
    let argv = minimist(process.argv.slice(2)),
        host = argv.host,
        maxPackages = argv.maxPackages || 2,
        store = argv.store,
        tag = argv.tag,
        packageMetaDataPath = argv.metadata

    if (!host){
        console.error('ERROR : host not defined. Use --host arg')
        return process.exit(1)
    }

    if (!store){
        console.error('ERROR : store not defined. Use --store arg')
        return process.exit(1)
    }

    const tmphost = host.toLowerCase()
    if (!tmphost.startsWith('http://') && !tmphost.startsWith('https://')){
        console.error('ERROR : host malformed, must start with http:// or https://')
        return process.exit(1)
    }

    if (!tag){
        console.error('ERROR : tag not defined. Use --tag <TAG>')
        return process.exit(1)
    }

    // path will not accept numbers, if latest code happens to be an int
    tag = tag.toString()

    let lookupUrl = urljoin(host, 'v1/packages/latest/', tag),
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

    const packageInfo = JSON.parse(taglookup.body),
        extractPath = await downloadPackage(host, store, packageInfo.id)

    await purgePackages(store, maxPackages)

    if (packageMetaDataPath) 
        await fs.outputJson(packageMetaDataPath, { 
            path : path.resolve(extractPath),
            id : packageInfo.id
        })


    console.log(`Package ${packageInfo.id} available at path ${extractPath}`)
}
