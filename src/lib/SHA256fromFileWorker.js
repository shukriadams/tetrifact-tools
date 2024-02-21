const crypto = require('crypto'),
    fs = require('graceful-fs'),
    parent = require('worker_threads').parentPort

parent.on('message', data => {

    const shasum = crypto.createHash('sha256')
    
    try {
        const s = fs.createReadStream(data.packageFile)

            s.on('data', data => {
                shasum.update(data)
            })
            
            s.on('error', err =>{
                parent.postMessage({err})
            })
        
            s.on('end', ()=>{
                s.close()
    
                parent.postMessage({
                    fileHash: shasum.digest('hex'),
                    relativePath : data.relativePath,
                    count : data.count
                })
            })

    
    } catch(ex) {
        parent.postMessage({err : ex})
    }
})
