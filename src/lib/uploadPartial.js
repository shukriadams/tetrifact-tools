const fsUtils = require('madscience-fsUtils'),
    hashHelper = require('./hashHelper'),
    path = require('path'),
    urljoin = require('urljoin'),
    minimist = require('minimist'),
    settingsProvider = require('./settings'),
    uploadHelper = require('./uploadHelper'),
    fs = require('fs-extra')

module.exports = async (packagePath) => {
    const args = settingsProvider.merge(minimist(process.argv.slice(2))),
        host = args.host,
        sourcePath = args.path,
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

    const pkg = await hashHelper.createPartialManifest(sourcePath)
    
    // await fs.writeJson('./tmp/pkg.json', pkg)
    // post manifest to tetrifact, get diff manifest back
    const diffManifest = { files : pkg } 
    const url = urljoin(host, 'v1/packages/findexisting')
    const result = await uploadHelper.uploadData(url, { Manifest : JSON.stringify(pkg) })
    console.log(JSON.stringify( result))

    return

    if (diffManifest.files.length > 30000){
        // upload entire 
    } else {
        // upload partial


        // stage files in new location
        let stageDirectory = '' 
        await fs.ensureDir(stageDirectory)

        for (let diffManifestFile of diffManifest.files){
            const currentPath = path.join(packagePath, diffManifestFile.path)
                stagePath = path.join(stageDirectory, diffManifestFile.path)

            await fs.copy(currentPath, stagePath)
        }
        
        // zip stage dir
        
        // post zip + diffManifest to tetrifact

    }
}