const process = require('process'), 
    minimist = require('minimist'),
    urljoin = require('urljoin'),
    request = require('request'),
    fs = require('fs-extra'),
    fsUtils = require('madscience-fsUtils'),
    settingsProvider = require('./settings'),
    path = require('path')
    
const upload = async function (url, filePath){
    return new Promise((resolve, reject)=>{
        try {

            const options = {
                headers : {
                    'Content-Type' : 'multipart/form-data',
                    'Transfer-Encoding' : 'chunked',
                },
                url : url,
                formData : {
                    Files: fs.createReadStream(filePath),
                }
            }

            request.post(options, function optionalCallback(err, httpResponse, body) {
                if (err) 
                    return reject(err)

                try {
                    body = JSON.parse(body)
                    resolve(body)
                } catch(ex){
                    reject(`Unexpected response ${body} is not valid JSON`)
                }
            })
        }catch(ex){
            reject (ex)
        }
    })
}

const SHA256FromData = function(data){
    const crypto = require('crypto'),
        shasum = crypto.createHash('sha256')

    shasum.update(data)
    return shasum.digest('hex')
}    


const SHA256fromFile = async filePath =>{
    const crypto = require('crypto'),
        shasum = crypto.createHash('sha256')

    return new Promise(async (resolve, reject)=>{
        try {
            const s = fs.ReadStream(filePath)

            s.on('data', data => {
                shasum.update(data)
            })
            
            s.on('error', err =>{
                reject(err)
            })

            s.on('end', ()=>{
                resolve(shasum.digest('hex'))
            })

        } catch(ex) {
            reject(ex)
        }
    })
}

const removePathRoot = (root, thePath)=>{
    let this_root = path.resolve(root)
    let this_thePath = path.resolve(thePath)
    this_thePath = this_thePath.substr(this_root.length + 1) // +1 to remove leading directory "/"
    return this_thePath
}

module.exports = async()=>{
    const settings = settingsProvider.merge(minimist(process.argv.slice(2))),
        host = settings.host,
        sourcePath = settings.path,
        package = settings.package
        
    if (!host){
        console.error('ERROR : host not defined. Use --host arg or add to settings')
        return process.exit(1)
    }

    if (!package){
        console.error('ERROR : package not defined. Use --package arg')
        return process.exit(1)
    }

    if (!sourcePath){
        console.error('ERROR : source path not defined. Use --path arg or add to settings')
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
        packageHashes += SHA256FromData(removePathRoot(sourcePath, packageFileName))
        packageHashes += await SHA256fromFile(packageFileName) 
    }

    packageHashes = SHA256FromData(packageHashes)

    try {
        await fsUtils.zipDir(sourcePath, archivePath)

        const result = await upload(url, archivePath)
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
