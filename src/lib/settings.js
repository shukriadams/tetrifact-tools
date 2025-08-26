let fs = require('fs-extra'),
    yaml = require('js-yaml'),
    settings = {
        
        // url to tetrifact server, egs https://tetrifact.example.com
        host: null,

        // local path to store packages in - store holds multiple packages, divided by package id
        store : null,

        // if true, older downloaded packages will be perged to make place for new ones
        purge : false,

        // number of packages to keep if purge is enabled
        keep: 2,

        logDir: null,
        
        // optional. Ticket to use when downloading from server.
        downloadTicket : '',

        // static ticket to use 
        ticket: null,

        // string to pass to tetrifact when requesting a download ticket
        ticketAgent: 'tetrifact-tools',

        // can be error|warn|info|debug in order of increasing spamminess.
        logLevel: 'warn'
    }

 // Load settings from YML file, merge with default settings
if (fs.existsSync('./.tetrifact.yml')){
    let userSettings = null

    try {
        const settingsYML = fs.readFileSync('./.tetrifact.yml', 'utf8')
        userSettings = yaml.safeLoad(settingsYML)
        console.log(`.tetrifact.yml found and loaded`)

    } catch (e) {
        console.error('Error reading settings.yml', e)
    }    
    
    settings = Object.assign(settings, userSettings)
}

// apply all ENV VARS over settings, this means that ENV VARs win over all other settings
for (const property in settings)
    settings[property] = process.env[`TETRIFACT_TOOLS-${property}`] || settings[property]

// ensure bool
try {
    settings.purge = settings.purge === true || settings.purge.toLowerCase() === 'true' || settings.purge === 1 ? true : false
} catch{
    // ignore user-forced error
    settings.purge = false
}

// ensure int
try {
    settings.keep = parseInt(settings.keep.toString())
} catch{
    // ignore user-forced error
    settings.keep = 2
}

// ensure keep at least 1 or the package currently downloaded will be purged
if (settings.keep < 1){
    console.log(`Keep was set to ${settings.keep} but a minimum of 1 is permitted`)
    settings.keep = 1
}

if (!settings.logDir)
   settings.logDir = './logs'

module.exports = {
    get (){
        return settings
    },

    /**
     * add incoming args to settings, this overrides built-in args, as well as args in .terifact.yml
     */
    mergeArgs(args){
        settings = Object.assign(settings, args)
    },

    merge(incoming){
        return Object.assign(settings, incoming)
    }
}