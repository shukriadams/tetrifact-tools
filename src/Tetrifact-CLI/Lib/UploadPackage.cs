using System.Diagnostics;
using System.IO;
using System;
using System.Collections.Generic;
using System.Text;

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
                Console.WriteLine("ERROR : source path not defined. Use --path <patj>.");
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
            string hashFilePath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, $"~{package}.hash");
            string archivePath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, $"~{package}");
            string url = WebHelper.Join(settingsRequest.Settings.Host, "v1/packages", package, "?isArchive=true");
            IEnumerable<string> packageHashes;
            string sourcePath = settingsRequest.Switches.Get("path");
            string sourcePathUnix = FileHelper.ToUnixPath(sourcePath);

            if (File.Exists(hashFilePath))
            {
                packageHashes = JsonHelper.Load<IEnumerable<string>>(hashFilePath);
            }
            else
            {
                HashService hashService = new HashService();
                Package pk = hashService.GenerateManifestFromFiles(sourcePath);

                JsonHelper.WriteJson(hashFilePath, pk);
            }
        }
    }
}

