const process = require('process'), 
    fs = require('fs-extra'),
    minimist = require('minimist'),
    urljoin = require('urljoin'),
    fsUtils = require('madscience-fsUtils'),
    httputils = require('madscience-httputils')

module.exports = async function(){
    const argv = minimist(process.argv.slice(2)),
        host = argv.host,
        maxPackages = argv.host || 10,
        package = argv.package

    if (!host){
        console.error('ERROR : host not defined. Use --host arg')
        return process.exit(1)
    }

    const tmphost = host.toLowerCase()
    if (!tmphost.startsWith('http://') && !tmphost.startsWith('https://')){
        console.error('ERROR : host malformed, most start with http:// or https://')
        return process.exit(1)
    }

    if (!package){
        console.error('ERROR : package not defined. Use --package arg')
        return process.exit(1)
    }

    const remoteURL = urljoin(host, 'v1/archives/', package),
        savePath = 'dl.zip',
        extractPath = 'dl',
        extractedFlag = '.dl'

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

        // write done flag
        await fs.outputFile(extractedFlag, '')
    }

    console.log(extractPath)
    process.exit(0)
}
