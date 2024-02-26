namespace TetrifactCLI 
{
    public class SettingsRequest
    {
        /// <summary>
        /// Null if failed
        /// </summary>
        public Settings Settings { get; set; }
         
        public bool Success { get; set; }

        public string Error { get; set; }
    }
}