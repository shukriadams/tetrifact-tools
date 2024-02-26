namespace TetrifactCLI
{
    public static class SettingsLoader
    {
        public static Settings Get(string[] args)
        {
            Settings settings = new Settings();
            
            // mergs .yml into settings
            // check if args specifies a yml path
            CommandLineSwitches switches = new CommandLineSwitches(args);
            if (switches.Contains("config")){
                if (!File.Exists(switches.Get("config")))
                {
                    
                }
            }
            // check if .yml exists next to app executable

            // merge args into settings

            return settings;
        }
    }
}