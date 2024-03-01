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
        }
    }
}

