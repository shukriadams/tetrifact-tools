const fsUtils = require('madscience-fsUtils'),
    hashHelper = require('./hashHelper'),
    path = require('path'),
    urljoin = require('urljoin'),
    minimist = require('minimist'),
    settingsProvider = require('./settings'),
    uploadHelper = require('./uploadHelper'),
    fs = require('fs-extra')

module.exports = async () => {
    const args = settingsProvider.merge(minimist(process.argv.slice(2))),
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
        console.error('ERROR : stage path not defined. Use --stage <path> or add to settings')
        return process.exit(1)
    }

    const manifest = await hashHelper.createManifest(sourcePath)
    const filteredManifestResult = await uploadHelper.uploadData(urljoin(host, 'v1/packages/filterexistingfiles'), { Manifest : JSON.stringify(manifest) })
    
    if (!filteredManifestResult.success)
        throw filteredManifestResult

    const filteredManifest = filteredManifestResult.success.manifest,
        uploadFiles = []

    for(let file of manifest.files)
        if (!filteredManifest.files.find(filteredFile => filteredFile.path === file.path))
            uploadFiles.push(file)

    // stage files that should be uploaded
    const stagePkgDirectory = path.join(stageDirectory, package)
    if (await fs.exists(stagePkgDirectory))
        await fs.remove(stagePkgDirectory) 

    await fs.ensureDir(stagePkgDirectory)

    for (let uploadFile of uploadFiles){
        const currentPath = path.join(sourcePath, uploadFile.path)
            stagePath = path.join(stagePkgDirectory, uploadFile.path)

        await fs.copy(currentPath, stagePath)
    }

    // zip stage dir
    const archivePath = path.join(stageDirectory, `${package}.zip`)
    await fsUtils.zipDir(stagePkgDirectory, archivePath)
    
    // push zip + existing manifest together
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