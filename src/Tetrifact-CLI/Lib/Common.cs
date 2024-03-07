namespace TetrifactCLI
{
    public class Common
    {
        public static string GetStagePathOrExitApplication(SettingsRequest settingsRequest) 
        {
            string stageDirectory;
            if (string.IsNullOrEmpty(settingsRequest.Settings.StagingPath))
            {
                stageDirectory = Path.Join(AppDomain.CurrentDomain.BaseDirectory, ".temp");
                Console.WriteLine($"Staging path not set, default to default {stageDirectory}");
                return stageDirectory;
            }
            else
            {
                if (!Directory.Exists(settingsRequest.Settings.StagingPath))
                {
                    Console.WriteLine($"Staging directory {settingsRequest.Settings.StagingPath} does not exist");
                    Environment.Exit(1);
                    return null;
                }

                return settingsRequest.Settings.StagingPath;
            }

        }
    }
}
