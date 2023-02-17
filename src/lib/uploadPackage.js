const process = require('process'), 
    minimist = require('minimist'),
    urljoin = require('urljoin'),
    hashHelper = require('./hashHelper'),
    fs = require('fs-extra'),
    fsUtils = require('madscience-fsUtils'),
    settingsProvider = require('./settings'),
    uploadHelper = require('./uploadHelper'),
    path = require('path')
    

const removePathRoot = (root, thePath)=>{
    let this_root = path.resolve(root)
    let this_thePath = path.resolve(thePath)
    this_thePath = this_thePath.substr(this_root.length + 1) // +1 to remove leading directory "/"
    return this_thePath
}

module.exports = async()=>{
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

    let archivePath = path.join(process.cwd(), `~${new Date().getTime()}` ),
        url = urljoin(host, 'v1/packages', package, '?isArchive=true')
        packageHashes = '',
        packageFileNames = await fsUtils.readFilesUnderDir(sourcePath)

    packageFileNames = packageFileNames.sort((a, b)=> {
        // to lowercase to match .net sorting 
        a = a.toLowerCase()
        b = b.toLowerCase()

        return a > b ? 1 :
            b > a ? -1 :
            0
    })

    for (const packageFileName of packageFileNames){
        packageHashes += hashHelper.SHA256FromData(removePathRoot(sourcePath, packageFileName))
        packageHashes += await hashHelper.SHA256fromFile(packageFileName) 
    }

    packageHashes = hashHelper.SHA256FromData(packageHashes)

    try {
        await fsUtils.zipDir(sourcePath, archivePath)

        const result = await uploadHelper.upload(url, archivePath)
        if (!result.success){
            return console.error(`Upload error`, result)
        }

        if (result.success.hash === packageHashes)
            console.log(`SUCCESS - package ${result.success.id} uploaded`)
        else
            console.error(`ERROR - local hash ${packageHashes} does not match remote ${result.success.hash}`)
        
    } catch(ex){
        console.log(ex)
    } finally {
        await fs.remove(archivePath)
    }

}    
