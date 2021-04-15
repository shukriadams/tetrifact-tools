let fs = require('fs-extra'),
    yaml = require('js-yaml'),
    settings = {
        
        // url to tetrifact server, egs https://tetrifact.example.com
        host: null,

        // local path to store packages in - store holds multiple packages, divided by package id
        store : null
    }

 // Load settings from YML file, merge with default settings
if (fs.existsSync('./tetrifact.yml')){
    let userSettings = null

    try {
        const settingsYML = fs.readFileSync('./tetrifact.yml', 'utf8')
        userSettings = yaml.safeLoad(settingsYML)
    } catch (e) {
        console.error('Error reading settings.yml', e)
    }    
    
    settings = Object.assign(settings, userSettings)
}

// apply all ENV VARS over settings, this means that ENV VARs win over all other settings
for (const property in settings)
    settings[property] = process.env[property] || settings[property]

module.exports = {
    get (){
        return settings
    },
    merge(incoming){
        return Object.assign(settings, incoming)
    }
}