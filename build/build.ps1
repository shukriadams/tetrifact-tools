$ErrorActionPreference = "Stop"

cd src
call npm install

cd ..
cd build
call npm install

sh build.sh --target win64 --upload 1 --repo shukriadams/tetrifact-tools --token $GH_TOKEN