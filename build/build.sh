# use :
# sh ./build.sh --target TARGET
#
# borrows generously from https://gist.github.com/stefanbuck/ce788fee19ab6eb0b4447a85fc99f447

# fail on errors
set -e 

# dynamic variables used 
#target= string
#upload= bool
#repo= string
#token= string

# capture all arguments passed in, that is anything starting with --
while [ $# -gt 0 ]; do
    if [[ $1 == *"--"* ]]; then
        param="${1/--/}"
        if [[ $2 == *"--"* ]]; then
            # if next value is next parameter, declare this parameter as empty string
            declare $param=true
        else
            declare $param="$2"
        fi
    fi
    shift
done

# get tag on this revision
tag=$(git describe --abbrev=0 --tags)

# ensure current revision is tagged
if [ -z "$tag" ]; then
    echo "ERROR : current revision has no tag on it, cannot upload";
    exit 1;
fi

# write version file
echo "{ \"version\" : \"$tag\" }" > ./../src/version.json

if [ -z "$target" ]; then
    echo "Building dev version. Use --target [linux64|win64] for other targets"
fi

if [ "$target" = "linux64" ]; then
    filename=./linux64/tetrifact-tools
    name="tetrifact-tools_linux64"

    $(npm bin)/pkg ./../src/. --targets node12-linux-x64 --output $filename

    # run app and ensure exit code was 0
    (${filename} --version )
elif [ "$target" = "win64" ]; then
    filename=./win64/tetrifact-tools.exe
    name="tetrifact-tools_win64.exe"

    $(npm bin)/pkg ./../src/. --targets node12-windows-x64 --output $filename
    
    # run app and ensure exit code was 0
    ($filename --version)
else
    # this mode is for dev, and on vagrant only
    filename=./linux64/tetrifact-tools
    name="tetrifact-tools_linux64"

    cd ./../src/Tetrifact-CLI
    dotnet restore
    dotnet publish --configuration Release --runtime win-x64 --self-contained
    
    # run app and ensure exit code was 0
    (./bin/Release/net6.0/win-x64/publish/Tetrifact-CLI.exe --version)
fi

# last output to stdout should be output of "--version" invoke, verify that returned 0 code
if [ ! $? -eq 0 ]; then
    echo "ERROR : App test failed " >&2
    exit 1
fi

echo "App built"

if [ "$upload" ]; then

    # ensure required arguments were passed in
    if [ -z "$repo" ]; then
        echo "--repo : github repo (user/repo) is required";
        exit 1;
    fi

    if [ -z "$token" ]; then
        echo "--token : github api token is required";
        exit 1;
    fi

    if wget --spider https://github.com/${repo}/releases/download/${tag}/${name} 2>/dev/null; then
        echo "Target build binary already exists on github, upload exiting"
        exit 0
    fi

    GH_REPO="https://api.github.com/repos/$repo"
    GH_TAGS="$GH_REPO/releases/tags/$tag"
    AUTH="Authorization: token $token"
    WGET_ARGS="--content-disposition --auth-no-challenge --no-cookie"
    CURL_ARGS="-LJO#"

    # Validate token.
    curl -o /dev/null -sH "$token" $GH_REPO || { echo "Error : token validation failed";  exit 1; }

    # Read asset tags.
    response=$(curl -sH "$token" $GH_TAGS)

    # Get ID of the asset based on given filename.
    eval $(echo "$response" | grep -m 1 "id.:" | grep -w id | tr : = | tr -cd '[[:alnum:]]=')
    [ "$id" ] || { echo "Error : Failed to get release id for tag: $tag"; echo "$response" | awk 'length($0)<100' >&2; exit 1; }

    # upload file to github
    GH_ASSET="https://uploads.github.com/repos/$repo/releases/$id/assets?name=$(basename $name)"
    curl --data-binary @"$filename" -H "Authorization: token $token" -H "Content-Type: application/octet-stream" $GH_ASSET

    echo "App uploaded"
fi

