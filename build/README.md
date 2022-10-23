
Typical Jenkins job will look like

    # npm install core src
    cd src
    call npm install

    # npm install pkg, workaround for Windows-based pkg builds
    cd ..
    cd build
    call npm install

    sh build.sh --target win64 --upload --repo shukriadams/tetrifact-tools --token %ACCESS_TOKEN%