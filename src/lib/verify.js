const { error } = require('console');
const process = require('process'),
    fs = require('fs-extra'),
    path = require('path'),
    log = require('./log'),
    jsonfile = require('jsonfile'),
    httputils = require('madscience-httputils'),
    hashHelper = require('./hashHelper'),
    urljoin = require('urljoin'),
    settingsProvider = require('./settings');

module.exports = async () =>{
    let args = settingsProvider.merge(minimist(process.argv.slice(2))),
        start = new Date(),
        host = args.host,
        cache = args.cache !== undefined,
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

    let manifestUrl = urljoin(host, 'v1/packages/', package),
        stageDirectory =  './stage',
        remoteManifest = await httputils.downloadJSON(manifestUrl),
        manifestFilePath = path.join(stageDirectory, 'local.manifest'),
        localManifest,
        errors = []

    remoteManifest = remoteManifest.success.package

    if (cache === true && await fs.exists(manifestFilePath)){
        console.log('loading cached local manifest ')
        localManifest = jsonfile.readFileSync(manifestFilePath)
    } else {
        localManifest = await hashHelper.createManifest(sourcePath, threads, verbose),
        await fs.ensureDir(stageDirectory)
        await fs.writeJson(manifestFilePath, localManifest, { spaces : 4 })
        console.log(`Cached local manifest to ${manifestFilePath}`)
    }

    let count = 0,
        length = localManifest.files.length

    for (const localManifestFile of localManifest.files){
        count++
        console.log(`checking local, ${count}/${length} - ${localManifestFile.path}`)
        if (!remoteManifest.files.find(remote => remote.path === localManifestFile.path && remote.hash === localManifestFile.hash))        
            errors.push(`Remote  is missing local file ${localManifestFile.path} @ hash ${localManifestFile.hash}`)

    }

    count = 0
    length = remoteManifest.files.length

    for (const remoteManifestFile of remoteManifest.files){
        count ++
        console.log(`checking remote, ${count}/${length} - ${remoteManifestFile.path}`)
        if (!localManifest.files.find(local => local.path === remoteManifestFile.path && local.hash === remoteManifestFile.hash))        
            errors.push(`Local is missing remote file ${remoteManifestFile.path} @ hash ${remoteManifestFile.hash}`)
    }

    if (errors.length){
        console.log('errors found')
        for (const err of errors)
            console.log(err)
    } else {
        console.log('no errors found')
    }
}   