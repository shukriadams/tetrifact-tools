using System.IO.Compression;

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

        public static void ZipDirectory(string directory, string archivePath) 
        { 
            IEnumerable<string> files = FilesUnder(directory);
            ZipDirectory(directory, files, archivePath);
        }

        public static void ZipDirectory(string root, IEnumerable<string> files, string archivePath ) 
        {
            // create zip file on disk asap to lock file name off
            using (FileStream zipStream = new FileStream(archivePath, FileMode.Create))
            using (ZipArchive archive = new ZipArchive(zipStream, ZipArchiveMode.Create, true))
                foreach (string file in files)
                {
                    string sourceFile = Path.Join(root, file);
                    ZipArchiveEntry zipEntry = archive.CreateEntry(file);

                    using (Stream zipEntryStream = zipEntry.Open())
                    using (FileStream sourcefileStream = new FileStream(sourceFile, FileMode.Open, FileAccess.Read, FileShare.Read))
                        sourcefileStream.CopyTo(zipEntryStream);
                }
        }
    }
}
