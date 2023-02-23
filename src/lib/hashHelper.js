const timebelt = require('timebelt')

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

    async createManifest(packagePath, maxThreads, verbose){
        return new Promise(async (resolve, reject)=>{
            try {

                const fsUtils = require('madscience-fsUtils'),
                    cons = require('./cons'),
                    { Worker } = require('worker_threads'),
                    path = require('path'),
                    fs = require('fs-extra')
        
                if (!await fs.exists(packagePath))
                    throw `Directory ${packagePath} does not exisit`
        
                // resolve absolute to replace
                const packagePathUnixPath = fsUtils.toUnixPath(path.resolve(packagePath))
        
                cons.log('generating list of package files')
                
                const manifest = {
                        files : [],
                        hash : null
                    },
                    packageFiles = await fsUtils.readFilesUnderDir(packagePath)
                    
                let count = 0,
                    threads = 0,
                    total = packageFiles.length
        
                cons.log(`generating manifest with ${maxThreads} threads`)
                
                while(packageFiles.length){
                    if(threads > maxThreads){
                        await timebelt.pause(10)
                        continue
                    }

                    threads++
                    count++
                    let packageFile = packageFiles[packageFiles.length -1];
                    packageFiles.splice(packageFiles.length - 1, 1)

                    packageFile = fsUtils.toUnixPath(path.resolve(packageFile))

                    let relativePath = fsUtils.toUnixPath(packageFile.replace(packagePathUnixPath, ''))
                    if (relativePath.startsWith('/'))
                        relativePath = relativePath.substring(1)
                    
                    const worker = new Worker('./lib/SHA256fromFileWorker.js')
                    // const fileHash = await this.SHA256fromFile(packageFile)
                    worker.on('message', workerResult => {
                        threads--
                        if (threads < 0)
                            threads = 0

                        if (workerResult.err)
                            return reject(workerResult.err)
                        
                        if (verbose)
                            cons.log(`processed file ${workerResult.count}/${total} (${threads} threads) ${workerResult.fileHash} ${workerResult.relativePath}`)

                        manifest.files.push({
                            path : workerResult.relativePath,
                            hash: workerResult.fileHash
                        })
            
                        worker.terminate()
                        
                        if (!packageFiles.length && !threads){
                            resolve(manifest)
                        }
                    })

                    worker.postMessage({
                        packageFile,
                        relativePath,
                        count
                    })

                }
        
            } catch(ex){
                reject (ex)
            }
        })
        
    }
}