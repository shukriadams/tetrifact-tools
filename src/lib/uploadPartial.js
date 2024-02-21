const fsUtils = require('madscience-fsUtils'),
    hashHelper = require('./hashHelper'),
    path = require('path'),
    urljoin = require('urljoin'),
    timebelt = require('timebelt'),
    minimist = require('minimist'),
    settingsProvider = require('./settings'),
    uploadHelper = require('./uploadHelper'),
    urlHelper = require('./urlHelper'),
    log = require('./log'),
    httputils = require('madscience-httputils'),
    fs = require('fs-extra')

module.exports = async () => {
    let args = settingsProvider.merge(minimist(process.argv.slice(2))),
        start = new Date(),
        host = args.host,
        sourcePath = args.path,
        stageDirectory = args.stage,
        package = args.package,
        threads = args.threads || 4,
        verbose = args.verbose !== undefined,
        force = args.force !== undefined
        
    if (!host){
        log.error('ERROR : host not defined. Use --host <host> or add to settings')
        process.exitCode = 1
        return
    }

    if (!package){
        log.error('ERROR : package not defined. Use --package <package>')
        process.exitCode = 1
        return
    }

    if (!sourcePath){
        log.error('ERROR : source path not defined. Use --path <path> or add to settings')
        process.exitCode = 1
        return
    }

    if (!stageDirectory){
        stageDirectory = './.stage'
        console.log('WARNING : stage path not defined. using app path as stage')
    }

    host = urlHelper.ensureFormat(host)

    // check if package exists on target
    const packageTestUrl = urljoin(host, 'v1/packages/', package, 'exists' ),
        existsLookup = await httputils.downloadJSON(packageTestUrl)
        
    if (existsLookup.success && existsLookup.success.exists){
        console.log(`Package ${package} already exists`)
        return
    }

    console.log(`generating manifest of package at ${sourcePath}`)

    let manifestFilePath = path.join(stageDirectory, 'package.manifest'),
        manifest = ''
        
    let manifestStart = new Date()
    manifest = await hashHelper.createManifest(sourcePath, threads, verbose)
    
    await fs.ensureDir(stageDirectory)
    await fs.writeJson(manifestFilePath, manifest, { spaces : 4 })

    console.log(`Manifest created in ${timebelt.minutesDifference(new Date(), manifestStart )} minutes`)

    console.log(`Posting manifest to ${host} to find existing files`)
    const filteredManifestResult = await uploadHelper.uploadData(urljoin(host, 'v1/packages/filterexistingfiles'), 
        { 
            Manifest : fs.createReadStream(manifestFilePath)
        }
    )
    
    if (!filteredManifestResult.success)
        throw filteredManifestResult

    const filteredManifest = filteredManifestResult.success.manifest,
        uploadFiles = []

    console.log(`Query of existing files found ${filteredManifest.files.length} common files out of ${manifest.files.length} files in total`)
    for(let file of manifest.files)
        if (!filteredManifest.files.find(filteredFile => filteredFile.path === file.path))
            uploadFiles.push(file)

    // stage files that should be uploaded
    const stagePkgDirectory = path.join(stageDirectory, package)
    if (await fs.exists(stagePkgDirectory))
        await fs.remove(stagePkgDirectory) 

    await fs.ensureDir(stagePkgDirectory)

    console.log(`Generating local zip of files not on host`)
    for (let uploadFile of uploadFiles){
        const currentPath = path.join(sourcePath, uploadFile.path)
            stagePath = path.join(stagePkgDirectory, uploadFile.path)

        await fs.copy(currentPath, stagePath)
    }

    // zip stage dir
    console.log(`Packing file to send`)
    const archivePath = path.join(stageDirectory, `${package}.zip`)
    await fsUtils.zipDir(stagePkgDirectory, archivePath)
    
    const commonFile = path.join(stageDirectory, `${package}_common.zip`)
    await fs.writeJson(commonFile, filteredManifest.files, { spaces : 4 })


    // push zip + existing manifest together
    console.log('Uploading package')


    const pkgPostUrl = urljoin(host, 'v1/packages', package, '?isArchive=true'),
        postResult = await uploadHelper.uploadData(pkgPostUrl, {
        Files: fs.createReadStream(archivePath),
        ExistingFiles : fs.createReadStream(commonFile)
    })

    if (postResult.success)
        return console.log(`Upload complete, took ${timebelt.minutesDifference(new Date(), start )} minutes`)
    else 
        return log.error(`Upload error`, postResult)
}