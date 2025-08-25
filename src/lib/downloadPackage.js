const urljoin = require('urljoin'),
    fs = require('fs-extra'),
    path = require('path'),
    log = require('./log'),
    httputils = require('madscience-httputils'),
    StreamZip = require('node-stream-zip')

module.exports = async(host, store, pkg, ticket, force = false)=>{

    // ensure package is string, url join fail on ints
    const statusUrl = urljoin(host, 'v1/archives/', pkg, 'status'),
        getUrl = urljoin(host, 'v1/archives/', `${pkg}?ticket=${ticket}`),
        savePath = path.join(store, `~${pkg}` ),
        extractPath = path.join(store, pkg),
        extractedFlag = path.join(store, `.${pkg}`)

    if (!await fs.exists(store))
        await fs.ensureDir(store)

    // check if the package has already been downloaded, we don't use the unpack folder presence for this as the folder
    // can be created but still be in an error state. Use the post-unpack flag instead
    if (await fs.exists(extractedFlag)){
        if (force){
            console.log(`Package ${pkg} already exists locally, proceeding with forced download.`)
        } else {
            console.log(`Package ${pkg} already exists locally, skipping download.`)
            return extractPath
        }
    }

    // ensure package exists
    let status
    try{
        status = await httputils.downloadJSON(statusUrl)
    } catch(ex){
        if (ex.statusCode && ex.statusCode === 404){
            console.log(`package ${pkg} does not exist`)
        } else {
            log.error(ex)
        }

        process.exitCode = 1
        return
    }

    if (!status.success){
        log.error(`error response from ${getUrl}: ${status}`)
        process.exitCode = 1
        return 
    }
    
    if (status.success.status.State != 'Processed_ArchiveAvailable'){
        console.log(`package ${pkg} could not be downloaded, status is "${status.success.status.State}"`)
        process.exitCode = 1
        return
    }

    try {
        console.log(`Downloading from ${getUrl}`)
        await httputils.downloadFile(getUrl, savePath, (progress, total)=>{
            let percent = (progress / total ) * 100
            console.log(`Progress: ${percent}%`)
        })
    } catch(ex){
        log.error(`${ex}`)
        process.exitCode = 1
        return 
    }

    // check if the downloaded file is empty, this is often caused by specifying the wrong protocol
    const stats = fs.statSync(savePath)
    
    if (!stats.size)
        log.warn(`the package from ${getUrl} is empty. This can often happen when the wrong host protocol (http/https) is used.`)

    // unzip
    try {
        console.log(`Uncompressing package`)
        const zip = new StreamZip.async({ file: savePath })
        await fs.ensureDir(extractPath)
        const count = await zip.extract(null, extractPath)
        console.log(`extracted ${count} files`)
    } catch (ex){
        log.error(`failed to unzip to ${savePath} to ${extractPath}:${ex}`)
        process.exitCode = 1
        return
    }

    await fs.remove(savePath)

    // write done flag
    await fs.writeJson(extractedFlag, { created : new Date().getTime() })

    return extractPath
}