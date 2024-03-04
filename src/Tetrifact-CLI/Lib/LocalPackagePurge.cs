namespace TetrifactCLI
{
    internal class LocalPackagePurge
    {
        public LocalPackagePurge() 
        { 

        }

        public void Purge(SettingsRequest settingsRequest ) 
        {
            if (!settingsRequest.Settings.Purge.HasValue || settingsRequest.Settings.Purge.Value == false)
                return;

            if (!settingsRequest.Settings.Keep.HasValue || settingsRequest.Settings.Keep.Value == 0)
                return;

            if (!Directory.Exists(settingsRequest.Settings.Store))
                return;
            

            IEnumerable<string> downloadedPackagesFlags = Directory.GetFiles(settingsRequest.Settings.Store);
            IList<PackageFlag> existingPackageFlags = new List<PackageFlag>();

            foreach (string packageFlag in downloadedPackagesFlags)
            {
                if (!packageFlag.StartsWith("."))
                    continue;

                PackageFlag packageFlagContent;

                try
                {
                    existingPackageFlags.Add(JsonHelper.Load<PackageFlag>(Path.Join(settingsRequest.Settings.Store, packageFlag)));
                }
                catch (Exception ex)
                {
                    // file is not a flag, ignore
                    continue;
                }
            }

            existingPackageFlags = existingPackageFlags.OrderByDescending(f => f.Created ).ToList();

            Console.WriteLine($"Autopurge found ${existingPackageFlags.Count} local packages, maximum allowed is ${ settingsRequest.Settings.Keep}");

            existingPackageFlags = existingPackageFlags.Skip(settingsRequest.Settings.Keep.Value).ToList();

            foreach (PackageFlag flag in existingPackageFlags) 
            {
                try
                {
                    Directory.Delete(Path.Join(settingsRequest.Settings.Store, flag.Package));
                    File.Delete(Path.Join(settingsRequest.Settings.Store, $".{flag.Package}"));
                    Console.WriteLine($"autopurge deleted package ${flag.Package}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error deleting  ");
                }
            }
        }
    }
}
