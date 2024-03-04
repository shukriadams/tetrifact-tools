namespace TetrifactCLI
{
    internal class FileHelper
    {
        public static IEnumerable<string> FilesUnder(string path) 
        {
            return Directory.GetFiles(path, "*.*", SearchOption.AllDirectories);
        }

        public static string ToUnixPath(string path)
        {
            return path.Replace("\\", "/");
        }
    }
}
