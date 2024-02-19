const urljoin = require('urljoin'),
    fs = require('fs-extra'),
    path = require('path'),
    httputils = require('madscience-httputils'),
    StreamZip = require('node-stream-zip')

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
        process.exitCode = 1
        return
    }

    if (status === 404){
        console.error(`ERROR : package ${remoteURL} does not exist`)
        process.exitCode = 1
        return 
    }

    try {
        console.log(`Downloading from ${remoteURL}`)
        await httputils.downloadFile(remoteURL, savePath)
    } catch(ex){
        console.error(`ERROR : ${ex}`)
        process.exitCode = 1
        return 
    }

    // check if the downloaded file is empty, this is often caused by specifying the wrong protocol
    const stats = fs.statSync(savePath)
    
    if (!stats.size)
        console.log(`WARNING : the package from ${remoteURL} is empty. This can often happen when the wrong host protocol (http/https) is used.`)

    // unzip
    try {
        console.log(`Uncompressing package`)
        const zip = new StreamZip.async({ file: savePath })
        await fs.ensureDir(extractPath)
        const count = await zip.extract(null, extractPath)
        console.log(`extracted ${count} files`)
    } catch (ex){
        console.error(`ERROR : failed to unzip to ${savePath} to ${extractPath}:${ex}`)
        process.exitCode = 1
        return
    }

    await fs.remove(savePath)

    // write done flag
    await fs.writeJson(extractedFlag, { created : new Date().getTime() })

    return extractPath
}