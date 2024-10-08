Build environment requires NodeJS 12.x, nothing else is required.

A typical CD job (on f.ex Jenkins) will set up and build, and looks like

    # npm install core src
    cd src
    call npm install

    # npm install pkg, workaround for Windows-based pkg builds
    cd ..
    cd build
    call npm install

    sh build.sh --target win64 --upload --repo shukriadams/tetrifact-tools --token %ACCESS_TOKEN%
