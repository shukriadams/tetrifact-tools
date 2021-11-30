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

## Build locally

Assuming you're working in Vagrant, build a Linux64 binary with

    cd build
    bash ./build.sh --target dev

The output file is `build/linux64/tetrifact-tools`.

