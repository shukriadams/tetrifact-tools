const timebelt = require('timebelt'),
    asyncLib = require('async'),
    { Worker } = require('worker_threads')

/** 
 * 
 * Work function must be passed in. Fucntion will be called with (listItem, itemPositionInList, optionalcallback)
 */
async function eachOfLimit(collection, maxParallel, work, onEachDone)
{
    currentProcesses = 0
    itemsProcessed = 0

    const timebelt = require('timebelt')

    while (true){
        await timebelt.pause(5) // throttle per iteration
        
        if(currentProcesses > maxParallel)
            continue

        if (!collection.length && !currentProcesses)
            break

        if (collection.length) {
            currentProcesses ++

            const item = collection[collection.length - 1]
            collection.splice(collection.length - 1, 1)
            console.log(`${currentProcesses}/${maxParallel} threads`)

            // do not await this
            work(item, itemsProcessed, ()=>{
                currentProcesses --
            })
            itemsProcessed ++
        }
    }
}

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

    async doWork(workerPath, packageFile, relativePath, count){
        return new Promise(async (resolve, reject)=>{
            try {
                const worker = new Worker(workerPath)
                worker.on('message', workerResult => {
                    worker.terminate()

                    if (workerResult.err)
                        return reject(workerResult.err)
                    
                    resolve(workerResult)
                })

                worker.postMessage({
                    packageFile,
                    relativePath,
                    count
                })
                
            } catch (ex){
                reject(ex)
            }
        })
    },

    async createManifest(packagePath, maxThreads, verbose){
        const fsUtils = require('madscience-fsUtils'),
            cons = require('./cons'),
            path = require('path'),
            fs = require('fs-extra')

        if (!await fs.exists(packagePath))
            throw `Directory ${packagePath} does not exisit`

        // resolve absolute to replace
        const packagePathUnixPath = fsUtils.toUnixPath(path.resolve(packagePath))

        cons.log('generating list of package files')
        
        let manifest = {
                files : [],
                hash : null
            },
            packageFiles = await fsUtils.readFilesUnderDir(packagePath)
            total = packageFiles.length

        if (!packageFiles.length)
            console.log(`WARNING - no files found at path ${packagePath}`)

        const workerPath = process.pkg ? path.join(__dirname, `SHA256fromFileWorker.js`) : './lib/SHA256fromFileWorker.js'
        
        await eachOfLimit(packageFiles, maxThreads, async (packageFile, count, done)=>{

            packageFile = fsUtils.toUnixPath(path.resolve(packageFile))

            let relativePath = fsUtils.toUnixPath(packageFile.replace(packagePathUnixPath, ''))
            if (relativePath.startsWith('/'))
                relativePath = relativePath.substring(1)

            if (verbose)
                cons.log(`processing file ${count}/${total} ${packageFile}`)
        
            // hammer file until it passes, ignore errors
            while (true){

                try {
                    const workerResult = await this.doWork(workerPath, packageFile, relativePath)
                    manifest.files.push({
                        path : workerResult.relativePath,
                        hash: workerResult.fileHash
                    })
                    
                    break

                }catch(ex){
                    console.log('err on worker')
                    console.log(ex)

                    if (ex.errno == -4066)
                    {
                        console.log('ignoring error')
                        // pause on error
                        await timebelt.pause(10)
                    }
                    else
                        reject(ex)
                        break
                }
            }

            done()
        })

        return manifest
    }
}