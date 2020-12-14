const process = require('process'), 
    path = require('path'),
    fs = require('fs-extra'),
    minimist = require('minimist'),
    urljoin = require('urljoin'),
    fsUtils = require('madscience-fsUtils'),
    httputils = require('madscience-httputils')

module.exports = async function(){
    let argv = minimist(process.argv.slice(2)),
        host = argv.host,
        maxPackages = argv.maxPackages || 2,
        store = argv.store,
        pkg = argv.package

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
        console.error('ERROR : host malformed, most start with http:// or https://')
        return process.exit(1)
    }

    if (!pkg){
        console.error('ERROR : package not defined. Use --package arg')
        return process.exit(1)
    }

    if (!await fs.exists(store))
        await fs.ensureDir(store)

    // path will not accept numbers, if package code happens to be an int
    pkg = pkg.toString()

    const remoteURL = urljoin(host, 'v1/archives/', pkg),
        savePath = path.join(store, `~${pkg}` ),
        extractPath = path.join(store, pkg),
        extractedFlag = path.join(store, `.${pkg}`)

    // check if the package has already been downloaded, we don't use the unpack folder presence for this as the folder
    // can be created but still be in an error state. Use the post-unpack flag instead
    if (!await fs.exists(extractedFlag)){
        // ensure package exists
        const status = await httputils.getStatus(remoteURL)
        
        if (status === 404){
            console.error(`ERROR : package ${remoteURL} does not exist`)
            return process.exit(1)
        }

        try {
            await httputils.downloadFile(remoteURL, savePath)
        } catch(ex){
            console.error(`ERROR : ${ex}`)
            return process.exit(1)
        }

        // check if the downloaded file is empty, this is often caused by specifying the wrong protocol
        const stats = fs.statSync(savePath)
        
        if (!stats.size)
            console.log(`WARNING : the package from ${remoteURL} is empty. This can often happen when the wrong host protocol (http/https) is used.`)

        // unzip
        try {
            await fsUtils.unzipToDirectory(savePath, extractPath)
        } catch (ex){
            console.error(`ERROR : failed to unzip to ${savePath} to ${extractPath}`)
            return process.exit(1)
        }

        await fs.remove(savePath)

        // write done flag
        await fs.writeJson(extractedFlag, { created : new Date().getTime() })
    }



    // remove older packages that exceed quota
    let downloadedPackagesFlags = await fsUtils.readFilesInDir(store, false),
        downloadedPackages = []

    for (const packageFlag of downloadedPackagesFlags){
        if (!packageFlag.startsWith('.'))
            continue

        let packageFlagContent
        try {
            packageFlagContent = await fs.readJson(path.join(store, packageFlag))
        } catch (ex){
            // file is not a flag, ignore
            continue
        }

        downloadedPackages.push({ created : packageFlagContent.created, package : packageFlag })
    }
    
    downloadedPackages = downloadedPackages.sort((a, b)=> {
        return a.created > b.created ? 1 :
            b.created > a.created ? -1 :
            0
    })

    if (downloadedPackages.length > maxPackages){
        downloadedPackages = downloadedPackages.map(r => r.package).slice(0, downloadedPackages.length - maxPackages)
        for (const downloadedPackage of downloadedPackages){
            await fs.remove(path.join(store, downloadedPackage))
            await fs.remove(path.join(store, downloadedPackage.substr(1)))
        }
    }

    console.log(extractPath)
    process.exit(0)
}
