const fsUtils = require('madscience-fsUtils'),
    hashHelper = require('./hashHelper'),
    path = require('path'),
    urljoin = require('urljoin'),
    minimist = require('minimist'),
    settingsProvider = require('./settings'),
    uploadHelper = require('./uploadHelper'),
    urlHelper = require('./urlHelper'),
    fs = require('fs-extra')

module.exports = async () => {
    let args = settingsProvider.merge(minimist(process.argv.slice(2))),
        host = args.host,
        sourcePath = args.path,
        stageDirectory = args.stage,
        package = args.package
        
    if (!host){
        console.error('ERROR : host not defined. Use --host <host> or add to settings')
        return process.exit(1)
    }

    if (!package){
        console.error('ERROR : package not defined. Use --package <package>')
        return process.exit(1)
    }

    if (!sourcePath){
        console.error('ERROR : source path not defined. Use --path <path> or add to settings')
        return process.exit(1)
    }

    if (!stageDirectory){
        stageDirectory = './.stage'
        console.log('WARNING : stage path not defined. using app path as stage')
    }

    host = urlHelper.ensureFormat(host)

    console.log(`generating manifest of package at ${sourcePath}`)
    let manifestFilePath = path.join(stageDirectory, 'package.manifest'),
        manifest = ''
        
    if (await fs.exists(manifestFilePath)){
        manifest = await fs.readJson(manifestFilePath) 
    } else {
        manifest = await hashHelper.createManifest(sourcePath)
        await fs.writeJson(manifestFilePath, manifest)
    }

    console.log(`Posting manifest to ${host} to find existing files`)
    const filteredManifestResult = await uploadHelper.uploadData(urljoin(host, 'v1/packages/filterexistingfiles'), { Manifest : JSON.stringify(manifest) })
    
    if (!filteredManifestResult.success)
        throw filteredManifestResult

    const filteredManifest = filteredManifestResult.success.manifest,
        uploadFiles = []

    console.log(`Query of existing files found ${manifest.files.length} matches`)
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
    
    // push zip + existing manifest together
    console.log('Uploading package')
    const pkgPostUrl = urljoin(host, 'v1/packages', package, '?isArchive=true')
    const postResult = await uploadHelper.uploadData(pkgPostUrl, {
        Files: fs.createReadStream(archivePath),
        ExistingFiles : JSON.stringify(filteredManifest.files)
    })

    if (postResult.success)
        return console.log('Upload complete')
    else 
        return console.error(`Upload error`, postResult)
}