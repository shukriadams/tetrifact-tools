namespace TetrifactCLI
{
    public class Package
    {
        public IEnumerable<PackageFile> Files { get; set; } = new List<PackageFile>();
        
        public string Hash { get; set; }

        public Package() 
        {

        }
    }
}
