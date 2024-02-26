using System.IO;
using YamlDotNet.Serialization;
using YamlDotNet.RepresentationModel;
using YamlDotNet.Serialization;

namespace TetrifactCLI
{
    public static class SettingsLoader
    {
        private static Settings Merge(Settings baseSettings, Settings overridingSettings) 
        {
            if (overridingSettings.Keep.HasValue)
                baseSettings.Keep = overridingSettings.Keep;

            if (!string.IsNullOrEmpty(overridingSettings.Host))
                baseSettings.Host = overridingSettings.Host;

            if (overridingSettings.Purge.HasValue)
                baseSettings.Purge = overridingSettings.Purge;

            if (!string.IsNullOrEmpty(overridingSettings.LogLevel))
                baseSettings.LogLevel = overridingSettings.LogLevel;

            if (!string.IsNullOrEmpty(overridingSettings.LogPath))
                baseSettings.LogPath = overridingSettings.LogPath;

            if (!string.IsNullOrEmpty(overridingSettings.Store))
                baseSettings.Store = overridingSettings.Store;

            return baseSettings;
        }

        private static bool ParseBool(object value, bool fallback) 
        {
            bool parse;
            if (value == null)
                return fallback;

            if (bool.TryParse(value.ToString(), out parse))
                return parse;
            else
                return fallback;
        }

        private static int ParseInt(object value, int fallback)
        {
            int parse;
            if (value == null)
                return fallback;

            if (int.TryParse(value.ToString(), out parse))
                return parse;
            else
                return fallback;
        }

        private static Settings FromArgs(string[] args) 
        {
            CommandLineSwitches switches = new CommandLineSwitches(args);
            Settings settings = new Settings();
            settings.Host = switches.Contains("host") ? switches.Get("host") : settings.Host;
            settings.LogLevel = switches.Contains("loglevel") ? switches.Get("loglevel") : settings.LogLevel;
            settings.Purge = ParseBool(switches.Get("Purge"), false);
            settings.LogPath = switches.Contains("logpath") ? switches.Get("logpath") : settings.LogPath;
            settings.Store = switches.Contains("store") ? switches.Get("store") : settings.Store;
            settings.Keep = ParseInt(switches.Get("keep"), 3);

            return settings;
        }

        public static SettingsRequest Get(string[] args)
        {
            // mergs .yml into settings
            // check if args specifies a yml path
            CommandLineSwitches switches = new CommandLineSwitches(args);
            string filePath = string.Empty;

            if (switches.Contains("config"))
            {
                filePath = switches.Get("config");
                if (!File.Exists(filePath))
                    return new SettingsRequest { Error = $"Config path {filePath} does not exist" };

                Console.WriteLine($"Using config at path {filePath}");            
            }
            else 
            {
                // check if .yml exists next to app executable

                string localConfigPath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, ".tetrifact-cli.yml");
                if (File.Exists(localConfigPath)) 
                {
                    Console.WriteLine($"Found config at path {filePath}");
                    filePath = localConfigPath;
                }
            }

            Settings defaultSettings = new Settings();

            if (!string.IsNullOrEmpty(filePath))
            {
                IDeserializer deserializer = YmlHelper.GetDeserializer();

                string rawYml = File.ReadAllText(filePath);
                Settings ymlSettings = deserializer.Deserialize<Settings>(rawYml);
                defaultSettings = Merge(defaultSettings, ymlSettings);
            }

            // merge starts args into settings
            Settings argsSettings = FromArgs(args);
            defaultSettings = Merge(defaultSettings, argsSettings);

            return new SettingsRequest 
            { 
                Success =  true, 
                Settings = defaultSettings 
            };
        }
    }
}