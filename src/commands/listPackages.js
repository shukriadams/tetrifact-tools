const process = require('process'),
    httputils = require('madscience-httputils'),
    minimist = require('minimist'),
    urljoin = require('urljoin'),
    log = require('./../lib/log'),
    settingsProvider = require('./../lib/settings')

module.exports = async () =>{
    let args = settingsProvider.merge(minimist(process.argv.slice(2))),
        host = args.host

    if (!host){
        log.error('host not defined. Use --host <host> or add to settings')
        process.exitCode = 1
        return 
    }

    console.log('Retrieving package list from server:\n')

    let url = urljoin(host, 'v1/packages'),
        response = await httputils.downloadJSON(url)
    
    if (!response.success || !response.success.packages){
        console.log(`unexpected json response from server: ${response}`)
        return
    }
    
    console.log(JSON.stringify(response.success.packages, null, 4))
}   