# Tetrifact-tools

Cross-platform, command line utility for doing useful things with [Tetrifact](https://github.com/shukriadams/tetrifact)

## Commands

### Get package

    tetrifact-tools getArchive --package foo --host https://mytetrifact.example.com --store c:/packages

Downloads and unpacks package `foo` from the given host to local folder `c:/packages/foo`

### Get latest package with tags

    tetrifact-tools getLatestArchiveWithTag --tag foo,bar --host https://mytetrifact.example.com --store c:/packages

Downloads and unpacks the latest package with tags `foo` and `bar` from the given host to local folder `c:/packages/foo`