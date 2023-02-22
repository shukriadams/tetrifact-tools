module.exports = {
    ensureFormat(url){
        if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://'))
            url = `http://${url}`

        return url
    }
}