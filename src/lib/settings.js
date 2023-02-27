let fs = require('fs-extra'),
    path = require('path'),
    process = require('process'),
    yaml = require('js-yaml'),
    settings = {
        
        // url to tetrifact server, egs https://tetrifact.example.com
        host: null,

        // local path to store packages in - store holds multiple packages, divided by package id
        store : null
    }

// Load settings from YML file, merge with default settings

// try to find config path, if running from pkg compiled exe it will be in dir relative 1st process.argv val, if running from 
// node source files it will relative to 2nd value
let settingsPath = path.join(path.dirname(process.argv[0]), 'tetrifact.yml')
if (!fs.existsSync(settingsPath)){
    settingsPath = path.join(path.dirname(process.argv[1]), 'tetrifact.yml')
    if (!fs.existsSync(settingsPath))
        settingsPath = null
}

if (settingsPath){
    console.log(`Found settings file at ${settingsPath}`)
    let userSettings = null

    try {
        const settingsYML = fs.readFileSync(settingsPath, 'utf8')
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