const fsUtils = require('madscience-fsUtils'),
    fs = require('fs-extra')

module.exports = async(store, maxPackages)=>{
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

    console.log(`autopurge found ${downloadedPackages.length} local packages, maximum allowed is ${maxPackages}`)

    if (downloadedPackages.length > maxPackages){
        downloadedPackages = downloadedPackages.map(r => r.package).slice(0, downloadedPackages.length - maxPackages)
        for (const downloadedPackage of downloadedPackages){
            await fs.remove(path.join(store, downloadedPackage))
            await fs.remove(path.join(store, downloadedPackage.substr(1)))
            console.log(`autopurge deleted package ${downloadedPackage}`)
        }
    }
}