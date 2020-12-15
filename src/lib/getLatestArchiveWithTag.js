const process = require('process'), 
    minimist = require('minimist'),
    urljoin = require('urljoin'),
    downloadPackage = require('./downloadPackage'),
    purgePackages = require('./purgePackages'),
    httputils = require('madscience-httputils')

module.exports = async function(){
    let argv = minimist(process.argv.slice(2)),
        host = argv.host,
        maxPackages = argv.maxPackages || 2,
        store = argv.store,
        tag = argv.tag

    if (!host){
        console.error('ERROR : host not defined. Use --host arg')
        return process.exit(1)
    }

    if (!store){
        console.error('ERROR : store not defined. Use --store arg')
        return process.exit(1)
    }

    const tmphost = host.toLowerCase()
    if (!tmphost.startsWith('http://') && !tmphost.startsWith('https://')){
        console.error('ERROR : host malformed, most start with http:// or https://')
        return process.exit(1)
    }

    if (!tag){
        console.error('ERROR : tag not defined. Use --tag <TAG>')
        return process.exit(1)
    }

    // path will not accept numbers, if latest code happens to be an int
    tag = tag.toString()

    const lookupUrl = urljoin(host, 'v1/packages/latest/', tag),
        lookup = await httputils.downloadString(lookupUrl)

    if (lookup.statusCode === 404){
        console.log(`No packages with tag ${tag} were found`)
        return process.exit(1)
    }

    if (lookup.statusCode !== 200){
        console.log(`Error doing tag request : ${lookup.body}`)
        return process.exit(1)
    }

    const packageInfo = JSON.parse(lookup.body)
    

    const extractPath = await downloadPackage(host, store, packageInfo.id)
    await purgePackages(store, maxPackages)

    

    console.log(extractPath)
    process.exit(0)
}
