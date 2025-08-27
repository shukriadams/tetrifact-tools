const urljoin = require('urljoin'),
    fs = require('fs-extra'),
    path = require('path'),
    log = require('./log'),
    process = require('process'),
    timebelt = require('timebelt'),
    httputils = require('madscience-httputils'),
    StreamZip = require('node-stream-zip')

module.exports = async(host, store, pkg, ticket, wait = false, force = false)=>{

    // ensure package is string, url join fail on ints
    const statusUrl = urljoin(host, 'v1/archives/', pkg, 'status'),
        savePath = path.join(store, `~${pkg}` ),
        extractPath = path.join(store, pkg),
        extractedFlag = path.join(store, `.${pkg}`),
        settingsProvider = require('./settings'),
        settings = settingsProvider.get()

    try {
        if (!await fs.exists(store))
            await fs.ensureDir(store)
        
    } catch (ex) {
        console.log(`Failed creating directory at ${store}:${ex}`)
        process.exitCode = 1
        return
    }


    // check if the package has already been downloaded, we don't use the unpack folder presence for this as the folder
    // can be created but still be in an error state. Use the post-unpack flag instead
    if (await fs.exists(extractedFlag)){
        if (force){
            console.log(`Package ${pkg} already exists locally, proceeding with forced download.`)
        } else {
            console.log(`Package ${pkg} already exists locally, skipping download.`)
            return extractPath
        }
    }

    const start = new Date()
    
    while(true){

        // ensure package exists
        let status
        
        try {
            status = await httputils.downloadJSON(statusUrl)
        }catch(ex){
            if (ex.statusCode && ex.statusCode === 404){
                log.error(`package ${pkg} does not exist`)
            } else {
                log.error(ex)
            }

            process.exitCode = 1
            return
        }

        if (wait && (status.success.status.state == 'Queued' || status.success.status.state == 'ArchiveGenerating')){
            const elapsedSeconds = timebelt.secondsDifference(Date.now(), start)
            if (elapsedSeconds > settings.waitTimeout){
                log.error(`Timed out (${settings.waitTimeout} seconds) waiting for package ${pkg} to become available, last status is "${status.success.status.state}".`)
                process.exitCode = 1
                return
            }

            log.info(`Waiting ${settings.waitTime} seconds for package ${pkg}, status is "${status.success.status.state}"`)
            await timebelt.pause(settings.waitTime * 1000)
            continue
        }

        if (status.success.status.state != 'Processed_ArchiveAvailable'){
            console.log(`package ${pkg} could not be downloaded, status is "${status.success.status.state}"`)
            process.exitCode = 1
            return
        } 

        break
    }


    // if no ticket passed in from settings, try to get one from server
    let ticketRequestUrl =  urljoin(host, 'v1/tickets/', settings.ticketAgent),
        ticketReponse

    try {
        ticketReponse = await httputils.post(ticketRequestUrl)
        if (ticketReponse.raw.statusCode != 200)
            throw { 
                description : `Unexpected statusCode ${ticketReponse.raw.statusCode} returned when requesting ticket. Body: ${ticketReponse.raw.body}`
            }
            
        let ticketInfo = JSON.parse(ticketReponse.raw.body)
        
        if (!ticketInfo.success)
            throw {
                description : `Unexpected ticket generation response : ${JSON.stringify(ticketInfo)}`
            }

        ticket = ticketInfo.success.ticket
        console.log(`Dynamically generated ticket ${ticket}`)

    } catch (ex) {
        log.error(ex)
        process.exitCode = 1
        return
    }

    const getUrl = urljoin(host, 'v1/archives/', `${pkg}?ticket=${ticket}`)
    if (!status.success){
        log.error(`error response from ${getUrl}: ${status}`)
        process.exitCode = 1
        return 
    }

    try {
        console.log(`Downloading from ${getUrl}`)
        let lastPercent = 0
        await httputils.downloadFile(getUrl, savePath, (progress, total)=>{
            let percent = Math.round((progress / total ) * 100, 0)
            if (percent != lastPercent) {
                process.stdout.write(`Progress: ${percent}%\r`)
                lastPercent = percent
            }
        })
    } catch(ex){
        log.error(`${ex}`)
        process.exitCode = 1
        return 
    }

    // unzip
    try {
        console.log(`Uncompressing package`)
        const zip = new StreamZip.async({ file: savePath })
        
        zip.on('entry', entry => {
            process.stdout.write(`Uncompressing ${entry.name}`)
        })

        await fs.ensureDir(extractPath)
        const count = await zip.extract(null, extractPath)
        console.log(`Uncompressed  ${count} files`)
    } catch (ex){
        log.error(`failed to unzip to ${savePath} to ${extractPath}:${ex}`)
        process.exitCode = 1
        return
    }

    await fs.remove(savePath)

    // write done flag
    await fs.writeJson(extractedFlag, { created : new Date().getTime() })

    return extractPath
}