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

    const pkg = await hashHelper.createPartialManifest(sourcePath)
    
    // await fs.writeJson('./tmp/pkg.json', pkg)
    // post manifest to tetrifact, get diff manifest back
    
    const url = urljoin(host, 'v1/packages/findexisting')
    const result = await uploadHelper.uploadData(url, { Manifest : JSON.stringify(pkg) })
    
    if (!result.success)
        throw result

    const diffManifest = result.success.manifest
    const uploadFiles = []

    // console.log(JSON.stringify( result))
    for(let file of pkg.files)
        if (!diffManifest.existing.find(e => e.path === file.path))
            uploadFiles.push(file)

    // stage it
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
        ExistingFiles : JSON.stringify(diffManifest.existing)
    })

    console.log(postResult)
}