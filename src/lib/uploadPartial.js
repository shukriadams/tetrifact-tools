const fsUtils = require('madscience-fsUtils'),
    hashHelper = require('./hashHelper'),
    path = require('path'),
    fs = require('fs-extra')

module.exports = async (packagePath) => {

    const pkg = await hashHelper.createPartialManifest(packagePath)
    
    // await fs.writeJson('./tmp/pkg.json', pkg)
    // post manifest to tetrifact, get diff manifest back
    const diffManifest = { files : [] } 
    
    if (diffManifest.files.length > 30000){
        // upload entire 
    } else {
        // upload partial


        // stage files in new location
        let stageDirectory = '' 
        await fs.ensureDir(stageDirectory)

        for (let diffManifestFile of diffManifest.files){
            const currentPath = path.join(packagePath, diffManifestFile.path)
                stagePath = path.join(stageDirectory, diffManifestFile.path)

            await fs.copy(currentPath, stagePath)
        }
        
        // zip stage dir
        
        // post zip + diffManifest to tetrifact

    }
}