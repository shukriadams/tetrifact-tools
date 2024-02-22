const { error } = require('console');
const process = require('process'),
    fs = require('fs-extra'),
    log = require('./log'),
    httputils = require('madscience-httputils'),
    hashHelper = require('./hashHelper'),
    urljoin = require('urljoin'),
    settingsProvider = require('./settings');

module.exports = async () =>{
    let args = settingsProvider.merge(minimist(process.argv.slice(2))),
        start = new Date(),
        host = args.host,
        sourcePath = args.path,
        package = args.package,
        threads = args.threads || 1,
        verbose = args.verbose !== undefined

    if (!host){
        log.error('ERROR : host not defined. Use --host <host> or add to settings')
        process.exitCode = 1
        return 
    }

    if (!package){
        log.error('ERROR : package not defined. Use --package <package>. This should be the package on --host you want to verify against local files')
        process.exitCode = 1
        return 
    }

    if (!sourcePath){
        log.error('ERROR : source path not defined. Use --path <path>. This should be a local directory you want to compare to remote --package files.')
        process.exitCode = 1
        return 
    }

    if (!await fs.exists(sourcePath)){
        log.error(`Could not find local package directory ${sourcePath}.`)
        process.exitCode = 1
        return
    }

    console.log('verifying local package')   

    const manifestUrl = urljoin(host, 'v1/packages/', package),
        remoteManifest = await httputils.downloadJSON(manifestUrl)

    let localManifest = await hashHelper.createManifest(sourcePath, threads, verbose),
        errors = []


    for (const localManifestFile in localManifest.files){
        if (!remoteManifest.files.find(remote => remote.path === localManifestFile.path && remote.hash === localManifestFile.hash))        
            errors.push(`Remote  is missing local file ${localManifestFile.path} @ hash ${localManifestFile.hash}`)
    }

    for (const remoteManifest in remoteManifest.files){
        if (!localManifest.files.find(local => local.path === remoteManifest.path && local.hash === remoteManifest.hash))        
            errors.push(`Local is missing remote file ${remoteManifest.path} @ hash ${remoteManifest.hash}`)
    }

    if (errors.length){
        console.log('errors found')
        for (const err of errors)
            console.log(err)
    } else {
        console.log('no errors found')
    }
}   