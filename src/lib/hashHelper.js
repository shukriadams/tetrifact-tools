module.exports = {

    SHA256FromData (data){
        const crypto = require('crypto'),
            shasum = crypto.createHash('sha256')
    
        shasum.update(data)
        return shasum.digest('hex')
    },    
    
    async SHA256fromFile(filePath){
        const crypto = require('crypto'),
            fs = require('fs-extra'),
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
    },

    async createPartialManifest(packagePath){
        const fsUtils = require('madscience-fsUtils'),
            path = require('path'),
            fs = require('fs-extra')

        if (!await fs.exists(packagePath))
            throw `Directory ${packagePath} does not exisit`

        // resolve absolute to replace
        const packagePathUnixPath = fsUtils.toUnixPath(path.resolve(packagePath))

        const packageSummary = {
                files : [],
                hash : null
            },
            packageFiles = await fsUtils.readFilesUnderDir(packagePath)
            
        
        for (let packageFile of packageFiles){

            const fileHash = await this.SHA256fromFile(packageFile)
            packageFile = fsUtils.toUnixPath(path.resolve(packageFile))
            let relativePath = fsUtils.toUnixPath(packageFile.replace(packagePathUnixPath, ''))

            packageSummary.files.push({
                path : relativePath,
                hash: fileHash
            })
        }

        return packageSummary
    }
}