using Newtonsoft.Json;

namespace TetrifactCLI;

class Program
{
    static void Main(string[] args)
    {
        string[] allowedFunctions = new string[] { "upload", "download", "downloadtagged", "uploadpartial", "verify" };
        CommandLineSwitches switches = new CommandLineSwitches(args);
        string func = args.Length == 0 ? string.Empty : args[0];

        Console.WriteLine("tetrifact-cli");
        if (switches.Contains("version"))
        {
            string versionFileRaw = ResourceHelper.ReadResourceAsString(typeof(Program), "version.json");
            LocalVersion version = JsonConvert.DeserializeObject<LocalVersion>(versionFileRaw);
            Console.WriteLine($"version {version.Version}");
            return;
        }

        if (string.IsNullOrEmpty(func)){
            Console.WriteLine("error - no function specified. use tetrifact-cli <function> [optional args]");
            Console.WriteLine("Supported functions are [${allowedFunctions.join('|')}]");
            Environment.Exit(1);
            return;
        }
       
        try 
        {
            switch(func) 
            {
                case "download": 
                    DownloadPackage.Work(args);
                    break;
                
                case "downloadtagged": 
                    DownloadPackagesWithTags.Work(args);
                    break;

                case "upload": 
                    UploadPackage.Work(args);
                    break;

                case "verify": 
                    VerifyLocalPackage.Work(args);
                    break;

                case "uploadpartial": 
                    UploadPartialPackage.Work(args);
                    break;

                default:
                    Console.WriteLine($"{func} is not supported - use {string.Join(",",allowedFunctions)}.");
                    break;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
            Environment.Exit(1);
        }
    }
}
