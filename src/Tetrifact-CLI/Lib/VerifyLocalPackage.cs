using System;
using System.Collections.Generic;
using System.Data.SqlTypes;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;

namespace TetrifactCLI
{
    public class VerifyLocalPackage 
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

            if (string.IsNullOrEmpty(settingsRequest.Settings.Host))
            {
                Console.WriteLine("ERROR : host not defined. Use --host <host>, or set in .yml file.");
                Environment.Exit(1);
                return;
            }

            if (!settingsRequest.Switches.Contains("pkg"))
            {
                Console.WriteLine("ERROR : package not defined. Use --package <package>");
                Environment.Exit(1);
                return;
            }

            if (!(settingsRequest.Switches.Contains("path")))
            {
                Console.WriteLine("ERROR : source path not defined. Use --path <path>.");
                Environment.Exit(1);
                return;
            }

            if (!settingsRequest.Settings.ExitAppOnInvalidUrl())
                return;

            string packageCode = settingsRequest.Switches.Get("pkg");
            string packageTestUrl = WebHelper.Join(settingsRequest.Settings.Host, "v1/packages", packageCode, "exists");
            if (WebHelper.GetStatus(packageTestUrl) == "404")
            {
                Console.WriteLine($"ERROR : package {packageCode} already exists on host.");
                Environment.Exit(1);
                return;
            }

            Console.WriteLine("Verifying local package");
            string manifestUrl = WebHelper.Join(settingsRequest.Settings.Host, "v1/packages", packageCode);
            string status = WebHelper.GetStatus(manifestUrl);
            if (status != "200") 
            {
                Console.WriteLine($"ERROR : package {packageCode} remote check returned {status}.");
                Environment.Exit(1);
                return;
            }

            string sourcePath = settingsRequest.Switches.Get("path");
            string stageDirectory = Common.GetStagePathOrExitApplication(settingsRequest);
            string manifestFilePath = Path.Join(stageDirectory, "local.manifest");
            PackageHttpHelper packageHttpHelper = new PackageHttpHelper();
            Package package = packageHttpHelper.DownloadPackage(settingsRequest.Settings.Host, packageCode);
            bool cache = settingsRequest.Switches.Contains("cache");
            Package localPackage = null;

            if (cache && File.Exists(manifestFilePath))
            {
                Console.WriteLine("loading cached local manifest");
                localPackage = JsonHelper.Load<Package>(manifestFilePath);
            }
            else
            {
                HashService hashService = new HashService();
                localPackage = hashService.GenerateManifestFromFiles(sourcePath);
                Directory.CreateDirectory(stageDirectory);
                JsonHelper.WriteJson(manifestFilePath, localPackage);
                Console.WriteLine($"Cached local manifest to {manifestFilePath}.");
            }

            int count = 0;
            int length = localPackage.Files.Count();
            IList<string> errors = new List<string>();

            foreach(PackageFile localManifestFile in localPackage.Files)
            {
                count++;
                Console.WriteLine($"checking local, {count}/{length} - {localManifestFile.Path}");
                if (!localPackage.Files.Any(remote => remote.Path == localManifestFile.Path && remote.Hash == localManifestFile.Hash))
                    errors.Add($"Remote is missing local file {localManifestFile.Path} @ hash {localManifestFile.Hash}");
            }

            if (errors.Any())
            {
                Console.WriteLine("errors found");
                foreach (string err in errors)
                    Console.WriteLine(err);
            }
            else
            {
                Console.WriteLine("no errors found");
            }
        }
    }
}

