using System.Runtime.CompilerServices;
using System.Text;

public class Settings
{
    #region PROPERTIES

    /// <summary>
    /// Url of server
    /// </summary>
    public string Host { get ; set ; }

    /// <summary>
    /// Local path packages are stored. Passed in as --store or in static yml file
    /// </summary>
    public string Store { get; set; }

    /// <summary>
    /// If true, an package fetch operation will also purge older packages in store, using the Keep 
    /// property to determine how many packages to keep.
    /// </summary>
    public bool? Purge { get; set; }

    /// <summary>
    /// 
    /// </summary>
    public int? Keep { get; set; }

    /// <summary>
    /// Local path this application writes logs.
    /// </summary>
    public string LogPath { get; set; }

    /// <summary>
    /// 
    /// </summary>
    public string LogLevel  { get; set; }

    #endregion

    #region CTORS

    public Settings()
    {
        // defaults here
    }

    #endregion

    #region METHODS

    public override string ToString()
    {
        StringBuilder display = new StringBuilder();

        display.AppendLine($"Host : {this.Host}");
        display.AppendLine($"Keep : {this.Keep}");
        display.AppendLine($"LogLevel : {this.LogLevel}");
        display.AppendLine($"LogPath : {this.LogPath}");
        display.AppendLine($"Purge : {this.Purge}");
        display.AppendLine($"Store : {this.Store}");

        return display.ToString();
    }

    public bool ExitAppOnInvalidUrl()
    {
        string hostTemp = this.Host.ToLower();
        if (!hostTemp.StartsWith("http://") && !hostTemp.StartsWith("https://"))
        {
            Console.WriteLine($"ERROR : host  url {hostTemp} is malformed, must start with http:// or https://");
            return false;
        }

        return true;
    }

    #endregion
}