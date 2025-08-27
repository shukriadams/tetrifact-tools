const fsUtils = require('madscience-fsUtils'),
    path = require('path'),
    settingsProvider = require('./settings'),
    settings = settingsProvider.get(),
    log = require('./log'),
    fs = require('fs-extra')

module.exports = async(store)=>{
    if (!settings.purge)
        return

    if (!settings.keep)
        return

    // remove older packages that exceed quota
    let downloadedPackagesFlags = await fsUtils.readFilesInDir(store, false),
        downloadedPackages = []

    for (const packageFlag of downloadedPackagesFlags){
        if (!packageFlag.startsWith('.'))
            continue

        let packageFlagContent
        try {
            packageFlagContent = await fs.readJson(path.join(store, packageFlag))
        } catch (ex){
            // file is not a flag, ignore
            continue
        }

        downloadedPackages.push({ created : packageFlagContent.created, package : packageFlag })
    }
    
    downloadedPackages = downloadedPackages.sort((a, b)=> {
        return a.created > b.created ? 1 :
            b.created > a.created ? -1 :
            0
    })

    log.info(`autopurge found ${downloadedPackages.length} local packages, maximum allowed is ${settings.keep}`)

    if (downloadedPackages.length > settings.keep){
        downloadedPackages = downloadedPackages.map(r => r.package).slice(0, downloadedPackages.length - settings.keep)

        for (const downloadedPackage of downloadedPackages){
            await fs.remove(path.join(store, downloadedPackage))
            log.info(`automatically removed package ${path.join(store, downloadedPackage)}`)
            await fs.remove(path.join(store, downloadedPackage.substr(1)))
            log.info(`autopurge deleted package ${downloadedPackage}`)
        }
    }
}