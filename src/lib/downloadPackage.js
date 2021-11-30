const urljoin = require('urljoin'),
    fs = require('fs-extra'),
    path = require('path'),
    fsUtils = require('madscience-fsUtils'),
    httputils = require('madscience-httputils')

module.exports = async(host, store, pkg, force = false)=>{

    // ensure package is string, url join fail on ints
    const remoteURL = urljoin(host, 'v1/archives/', pkg.toString()),
        savePath = path.join(store, `~${pkg}` ),
        extractPath = path.join(store, pkg),
        extractedFlag = path.join(store, `.${pkg}`)

    if (!await fs.exists(store))
        await fs.ensureDir(store)

    // check if the package has already been downloaded, we don't use the unpack folder presence for this as the folder
    // can be created but still be in an error state. Use the post-unpack flag instead
    if (await fs.exists(extractedFlag)){
        if (force){
            console.log(`Package already exists locally, proceeding with forced download.`)
        } else {
            console.log(`Package already exists locally, skipping download.`)
            return extractPath
        }
    }

    // ensure package exists
    let status
    try{
        status = await httputils.getStatus(remoteURL)
    } catch(ex){
        console.log(ex)
        return process.exit(1)
    }

    if (status === 404){
        console.error(`ERROR : package ${remoteURL} does not exist`)
        return process.exit(1)
    }

    try {
        console.log(`Downloading from ${remoteURL}`)
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
        console.log(`Uncompressing package`)
        await fsUtils.unzipToDirectory(savePath, extractPath)
    } catch (ex){
        console.error(`ERROR : failed to unzip to ${savePath} to ${extractPath}`)
        return process.exit(1)
    }

    await fs.remove(savePath)

    // write done flag
    await fs.writeJson(extractedFlag, { created : new Date().getTime() })

    return extractPath
}