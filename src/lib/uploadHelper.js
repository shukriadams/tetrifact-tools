const request = require('request'),
    fs = require('fs-extra')

module.exports = {
    async uploadData(url, data){

        return new Promise((resolve, reject)=>{
            try {
    
                const options = {
                    headers : {
                        'Content-Type' : 'multipart/form-data',
                        'Transfer-Encoding' : 'chunked',
                    },
                    url : url,
                    formData : data
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
    },

    async upload(url, filePath){
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
}