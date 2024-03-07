using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace TetrifactCLI
{
    public class UploadPartialPackage 
    {
        public static void Work(string[] args)
        {
            SettingsRequest settingsRequest = SettingsLoader.Get(args);
            
            if (!settingsRequest.Success)
            {
                Console.WriteLine($"ERROR : Failed to parse settings : {settingsRequest.Error}");
                Environment.Exit(1);
                return;
            }

            if (string.IsNullOrEmpty(settingsRequest.Settings.Store))
            {
                Console.WriteLine("ERROR : host not defined. Use --store <host>, or set in .yml file.");
                Environment.Exit(1);
                return;
            }

            if (string.IsNullOrEmpty(settingsRequest.Settings.Host))
            {
                Console.WriteLine("ERROR : host not defined. Use --host <host>, or set in .yml file.");
                Environment.Exit(1);
                return;
            }

            if (!(settingsRequest.Switches.Contains("path")))
            {
                Console.WriteLine("ERROR : source path not defined. Use --path <path>.");
                Environment.Exit(1);
                return;
            }

            if (!settingsRequest.Switches.Contains("pkg"))
            {
                Console.WriteLine("ERROR : package not defined. Use --package <package>");
                Environment.Exit(1);
                return;
            }

            string stageDirectory = Common.GetStagePathOrExitApplication(settingsRequest);
            string package = settingsRequest.Switches.Get("pkg");
            string packageTestUrl = WebHelper.Join(settingsRequest.Settings.Host, "v1/packages", package, "exists");
            string sourcePath = settingsRequest.Switches.Get("path");

            if (WebHelper.GetStatus(packageTestUrl) == "404")
            {
                Console.WriteLine($"ERROR : package {package} already exists on host.");
                Environment.Exit(1);
                return;
            }

            Console.WriteLine($"generating manifest of package at {sourcePath}");

            string manifestFilePath = Path.Join(stageDirectory, "package.manifest");
            DateTime manifestStart = DateTime.UtcNow;
            HashService hashService = new HashService();
            Package manifest = hashService.GenerateManifestFromFiles(sourcePath);
            JsonHelper.WriteJson(manifestFilePath, manifest);

            TimeSpan taken = DateTime.UtcNow - manifestStart;
            Console.WriteLine($"Manifest created in ${Math.Round(taken.TotalMinutes, 0)} minutes");
            Console.WriteLine($"Posting manifest to ${settingsRequest.Settings.Host} to find existing files");

            PackageHttpHelper packageHttpHelper = new PackageHttpHelper();
            IEnumerable<string> commonFiles = packageHttpHelper.GetCommonFiles(settingsRequest.Settings.Host, manifestFilePath);

            Console.WriteLine("Query of existing files found ${ filteredManifest.files.length} common files out of ${ manifest.files.length} files in total");
            IList<string> uploadFiles = new List<string>();
            foreach (PackageFile file in manifest.Files)
                if (!commonFiles.Any(commonFile => commonFile == file.Path))
                    uploadFiles.Add(sourcePath);

            string stagePkgDirectory = Path.Join(stageDirectory, package);

            // force wipe existing package stage dir
            if (Directory.Exists(stagePkgDirectory))
                Directory.Delete(stagePkgDirectory, true);

            // create stage dir
            Directory.CreateDirectory(stagePkgDirectory);

            Console.WriteLine("Generating local zip of files not on host");
            foreach (string uploadFile in uploadFiles)
            {
                string currentPath = Path.Join(sourcePath, uploadFile);
                string stagePath = Path.Join(stagePkgDirectory, uploadFile);

                File.Copy(currentPath, stagePath);
            }

            // zip stage dir
            Console.WriteLine("Packing file to send");
            string archivePath = Path.Join(stageDirectory, $"{package}.zip");
            FileHelper.ZipDirectory(stagePkgDirectory, archivePath);


            string commonFilesList = Path.Join(stageDirectory, $"{package}_common.json");
            JsonHelper.WriteJson(commonFilesList, commonFiles);

            Console.WriteLine("Uploading package");
            string pkgPostUrl = WebHelper.Join(settingsRequest.Settings.Host, "v1/packages", package, "?isArchive=true");
            string postResult = packageHttpHelper.UploadPackageSubset(pkgPostUrl, archivePath, commonFilesList);

            Console.WriteLine("Post result:");
            Console.WriteLine(postResult);
        }
    }
}

