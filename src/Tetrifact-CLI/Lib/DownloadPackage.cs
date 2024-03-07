using System;

namespace TetrifactCLI
{
    public class DownloadPackage 
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

            if (string.IsNullOrEmpty(settingsRequest.Settings.Store))
            {
                Console.WriteLine("ERROR : host not defined. Use --store <host>, or set in .yml file.");
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

            PackageHttpHelper downloader = new PackageHttpHelper();
            string packagePath = downloader.Download(settingsRequest.Settings.Host, 
                settingsRequest.Settings.Store, 
                settingsRequest.Switches.Get("pkg"), false);

            LocalPackagePurge purge = new LocalPackagePurge();
            purge.Purge(settingsRequest);

            Console.WriteLine($"Package downloaded available at path {packagePath}");
        }
    }
}

