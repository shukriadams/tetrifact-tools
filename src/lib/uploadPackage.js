const process = require('process'), 
    minimist = require('minimist'),
    urljoin = require('urljoin'),
    hashHelper = require('./hashHelper'),
    fs = require('fs-extra'),
    fsUtils = require('madscience-fsUtils'),
    settingsProvider = require('./settings'),
    uploadHelper = require('./uploadHelper'),
    urlHelper = require('./urlHelper'),
    log = require('./log'),
    path = require('path')
    

const removePathRoot = (root, thePath)=>{
    let this_root = path.resolve(root)
    let this_thePath = path.resolve(thePath)
    this_thePath = this_thePath.substr(this_root.length + 1) // +1 to remove leading directory "/"
    return this_thePath
}

module.exports = async()=>{
    let args = settingsProvider.merge(minimist(process.argv.slice(2))),
        host = args.host,
        sourcePath = args.path,
        package = args.package
        
    if (!host){
        log.error('host not defined. Use --host <host> or add to settings')
        process.exitCode = 1
        return 
    }

    if (!package){
        log.error('package not defined. Use --package <package>')
        process.exitCode = 1
        return 
    }

    if (!sourcePath){
        log.error('source path not defined. Use --path <path> or add to settings')
        process.exitCode = 1
        return 
    }

    host = urlHelper.ensureFormat(host)
    let hashFilePath = path.join(process.cwd(), `~${package}.hash`), 
        archivePath = path.join(process.cwd(), `~${package}` ),
        url = urljoin(host, 'v1/packages', package, '?isArchive=true')
        packageHashes = ''

    if (await fs.exists(hashFilePath)){
        packageHashes = await fs.readJson(hashFilePath)
    } else {

        console.log(`generating a list of all files in ${sourcePath}`)
        let packageFileNames = await fsUtils.readFilesUnderDir(sourcePath)
    
        packageFileNames = packageFileNames.sort((a, b)=> {
            // to lowercase to match .net sorting 
            a = a.toLowerCase()
            b = b.toLowerCase()
    
            return a > b ? 1 :
                b > a ? -1 :
                0
        })
    
        console.log('generating hash of package files')

        let count = 0,
            total = packageFileNames.length
    
        for (const packageFileName of packageFileNames){
            packageHashes += hashHelper.SHA256FromData(removePathRoot(sourcePath, packageFileName))
            packageHashes += await hashHelper.SHA256fromFile(packageFileName) 
            count ++
            
            if (count % 100 === 0)
                process.stdout.write(`${count}/${total}`.padEnd(50) + '\x1b[0G')
        }
    
        packageHashes = hashHelper.SHA256FromData(packageHashes)
        await fs.writeJson(hashFilePath, packageHashes)
    }

    try {

        if (!await fs.exists(archivePath)){
            console.log('generating zip of local files')
            await fsUtils.zipDir(sourcePath, archivePath)
        }

        console.log('uploading zip')
        const result = await uploadHelper.upload(url, archivePath)
        if (!result.success){
            return log.error(`Upload error`, result)
        }

        if (result.success.hash === packageHashes){
            console.log(`SUCCESS - package ${result.success.id} uploaded`)
            await fs.remove(archivePath)
        }
        else
            log.error(`ERROR - local hash ${packageHashes} does not match remote ${result.success.hash}`)
        
    } catch(ex){
        log.error(ex)
    } 
}
