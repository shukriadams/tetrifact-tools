using System.IO.Compression;
using System.Net;

namespace TetrifactCLI
{
    internal class PackageHttpHelper
    {
        public string Download(string host, string store, string pkg, bool force) 
        {
            // ensure package is string, url join fail on ints
            string remoteURL = WebHelper.Join(host, "v1/archives", pkg);
            string zipSavePath = Path.Join(store, "~${ pkg}");
            string zipExtractPath = Path.Join(store, pkg);
            string extractedFlag = Path.Join(store, "`.${ pkg}");

            Directory.CreateDirectory(store);

            if (File.Exists(extractedFlag))
            {
                if (force)
                {
                    Console.WriteLine($"Package {pkg} already exists locally, proceeding with forced download.");
                }
                else
                {
                    Console.WriteLine($"Package {pkg} already exists locally, skipping download.");
                    return zipExtractPath;
                }
            }

            // ensure package exists
            string status = WebHelper.GetStatus(remoteURL);
            if (status != "200")
                throw new Exception($"Package lookup error, status {status} for {remoteURL}");

            // 
            Console.WriteLine($"Downloading package from {remoteURL} ...");
            WebClient client = new WebClient();
            client.DownloadFile(remoteURL, zipSavePath);

            // check if file is empty
            long fileSize = new FileInfo(zipSavePath).Length;
            if (fileSize == 0)
                Console.WriteLine($"WARNING : {zipSavePath} is empty. This can often happen when the wrong host protocol (http/https) is used.");

            // unzip
            using (FileStream fileStream = new FileStream(zipSavePath, FileMode.Open))
            using (ZipArchive archive = new ZipArchive(fileStream))
            {
                // if .Name empty it's a directory
                IEnumerable<ZipArchiveEntry> items = archive.Entries.Where(r => !string.IsNullOrEmpty(r.Name));
                int count = 0;
                int total = items.Count();

                foreach (ZipArchiveEntry entry in items)
                {
                    string targetFile = Path.Join(zipExtractPath, entry.FullName);
                    string targetDirectory = Path.GetDirectoryName(targetFile);
                    Directory.CreateDirectory(targetDirectory);
                    entry.ExtractToFile(targetFile);
                    count++;
                }
            }

            File.Delete(zipSavePath);

            JsonHelper.WriteJson(extractedFlag, new PackageFlag { Created = DateTime.UtcNow, Package = pkg });

            return zipExtractPath;
        }


        public string GetLatestPackageWithTag(string host, string tag) 
        {
            string tagUrl = WebHelper.Join(host, "v1/packages/latest", tag);

            WebClient webClient = new WebClient();
            string rawJson = string.Empty;
            try
            {
                rawJson = webClient.DownloadString(tagUrl);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error contacting host {host}", ex);
            }

            try
            {
                dynamic response = Newtonsoft.Json.JsonConvert.DeserializeObject(rawJson);
                if (response == null || response.success == null)
                    throw new Exception($"Error {rawJson}");

                return response.success.package;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to parse JSON content {rawJson}", ex);
            }
        }
    }
}
