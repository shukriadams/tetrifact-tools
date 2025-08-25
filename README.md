# Tetrifact-tools

Cross-platform, command line utility for doing useful things with [Tetrifact](https://github.com/shukriadams/tetrifact)

## Commands

### Get package

    tetrifact-tools 
        download
        --package foo 
        --host https://mytetrifact.example.com 
        --store c:/packages

Downloads and unpacks package `foo` from the given host to local folder `c:/packages/foo`

### Get latest package with tags

    tetrifact-tools 
        downloadtagged 
        --tag foo,bar 
        --host https://mytetrifact.example.com 
        --store c:/packages 
        --metadata c:/myrequest.json

Downloads and unpacks the latest package with tags `foo` and `bar` from the given host to local folder `c:/packages/foo`. The `--metadata` argument is option, this is where a specific request will write information about its result, in this case, the exact path a package was written to, and the id of that package. This can be useful when using tetrifact-tool from script where the package id needs to be used.

## Static config

To save on having to specific --store and --host for each call, create a `.tetrifact.yml` file in the same path as your tetrifact-tools executable. In this file add

    # url of tetrifact server
    host: http://your.tetrifact.server:49023

    # local path pat to store packages
    store: ./path/to/your/local/store

    # if true, older packages will be purged. optional
    purge : true        

    # nr of packages to keep after purging. optional
    keep: 3             

## Development

Setup project with 

    npm install

Run with

    npm start 

Debug with (debugger can be attached)

    npm run debug 

Standard with NodeJS apps, you can call commands directly with `node index <COMMAND> --someArg someValue`, or with `npm start <COMMAND> -- --someArg someValue`. Note the extra `--` to carry over argumens to npm. Invoking with npm is likely better as the compiled version uses this, plus npm has convenient extra arguments for f.ex debugging - these can be read in `src/package.json`.

## Build locally

Assuming you're working in Vagrant, build a Linux64 binary with

    cd build
    bash ./build.sh --target dev

The output file is `build/linux64/tetrifact-tools`.

## Testing

1. Ensure the dev version of Tetrifact is running with `docker ps -a`. If not, start it with

        cd dev
        docker-compose up -d

2. Ensure there are packages in Tetrifact

        curl localhost:49023/v1/packages

    if not, create simples packages using any file, example the README.md in project root

        curl -X POST -H "Content-Type: multipart/form-data" -F "Files=@README.md" http://localhost:49023/v1/packages/mypackage

3. 
