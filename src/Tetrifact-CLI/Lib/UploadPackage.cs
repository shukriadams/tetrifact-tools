using System;

namespace TetrifactCLI
{
    public class UploadPackage 
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

            if (!settingsRequest.Settings.ExitAppOnInvalidUrl())
                return;

            string package = settingsRequest.Switches.Get("pkg");
            string packageTestUrl = WebHelper.Join(settingsRequest.Settings.Host, "v1/packages", package, "exists");
            if (WebHelper.GetStatus(packageTestUrl) == "404")
            {
                Console.WriteLine($"ERROR : package {package} already exists on host.");
                Environment.Exit(1);
                return;
            }

            string hashFilePath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, $"~{package}.hash");
            string archivePath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, $"~{package}");
            string url = WebHelper.Join(settingsRequest.Settings.Host, "v1/packages", package, "?isArchive=true");
            IEnumerable<string> packageHashes;
            string sourcePath = settingsRequest.Switches.Get("path");
            string sourcePathUnix = FileHelper.ToUnixPath(sourcePath);
            Package pkg;

            if (File.Exists(hashFilePath))
            {
                pkg = JsonHelper.Load<Package>(hashFilePath);
            }
            else
            {
                HashService hashService = new HashService();
                pkg = hashService.GenerateManifestFromFiles(sourcePath);

                JsonHelper.WriteJson(hashFilePath, pkg);
            }

            if (!File.Exists(archivePath)) 
            {
                Console.WriteLine("generating zip of local files");
                FileHelper.ZipDirectory(sourcePath, pkg.Files.Select(f => f.Path), archivePath);
            }

            Console.WriteLine("uploading zip");
            PackageHttpHelper httpHelper = new PackageHttpHelper();
            string result = httpHelper.UploadArchive(url, archivePath);

            if (result == "200")
                Console.WriteLine("Upload succeeded");
            else
                Console.WriteLine($"Upload failed with code {result}");
        }
    }
}

