using System.Security.Cryptography;
using System.Text;

namespace TetrifactCLI
{
    /// <summary>
    /// SHA256 hashing
    /// </summary>
    public class HashService 
    {

        /// <summary>
        /// Locally utilty function, hex stage of generating hash.
        /// </summary>
        /// <param name="bytes"></param>
        /// <returns></returns>
        private string ToHex(byte[] bytes)
        {
            StringBuilder s = new StringBuilder();

            foreach (byte b in bytes)
                s.Append(b.ToString("x2").ToLower());

            return s.ToString();
        }


        /// <summary>
        /// Generates a SHA256 hash of the file at the given path.
        /// </summary>
        /// <param name="filePath"></param>
        /// <returns>Tupple with file hash and file size (length)</returns>
        public FileOnDiskProperties FromFile(string filePath)
        {
            using (FileStream fs = File.OpenRead(filePath))
            using (HashAlgorithm hashAlgorithm = SHA256.Create())
            {
                byte[] hash = hashAlgorithm.ComputeHash(fs);
                return new FileOnDiskProperties { Hash = ToHex(hash), Size = fs.Length };
            }
        }


        /// <summary>
        /// Generates a SHA256 hash from a byte array.
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        public string FromByteArray(byte[] data)
        {
            MemoryStream stream = new MemoryStream(data);
            using (HashAlgorithm hashAlgorithm = SHA256.Create())
            {
                byte[] hash = hashAlgorithm.ComputeHash(stream);
                return ToHex(hash);
            }
        }


        /// <summary>
        /// Generates a SHA256 hash from a string.
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public string FromString(string str)
        {
            Stream stream = StreamsHelper.StreamFromString(str);
            using (HashAlgorithm hashAlgorithm = SHA256.Create())
            {
                byte[] hash = hashAlgorithm.ComputeHash(stream);
                return ToHex(hash);
            }
        }


        /// <summary>
        /// Sorts file paths so they are in standard order for hash creation.
        /// </summary>
        /// <param name="files"></param>
        /// <returns></returns>
        public IEnumerable<string> SortFileArrayForHashing(IEnumerable<string> files)
        {
            string[] sorted = files.ToArray();
            Array.Sort(sorted, (x, y) => String.Compare(x, y));
            return sorted;
        }

        public Package GenerateManifestFromFiles(string sourcePath) 
        {
            IEnumerable<string> packageFileNames = FileHelper.FilesUnder(sourcePath);

            string sourcePathUnix = FileHelper.ToUnixPath(sourcePath);
            packageFileNames = packageFileNames.OrderBy(f => f);


            int total = packageFileNames.Count();

            StringBuilder hashBuilder = new StringBuilder();
            HashService hashService = new HashService();
            Package package = new Package();
            IList<PackageFile> packageFiles = new List<PackageFile>();

            foreach (string packageFileName in packageFileNames)
            {
                string filePath = FileHelper.ToUnixPath(packageFileName);
                filePath = filePath.Substring(sourcePathUnix.Length);

                PackageFile packageFile = new PackageFile();
                packageFile.Path = filePath;
                packageFile.Hash = hashService.FromString(filePath) + hashService.FromFile(packageFileName);
                hashBuilder.Append(packageFile.Hash);

                packageFiles.Add(packageFile);
            }

            package.Files = packageFiles;
            package.Hash = hashService.FromString(hashService.ToString());

            return package;
        }
    }
}
