using Newtonsoft.Json;
using System;
using System.IO;

namespace TetrifactCLI
{
    internal static class JsonHelper
    {
        public static T Load<T>(string path) 
        {
            if (!File.Exists(path))
                throw new Exception($"File {path} not found.");

            string fileContent = File.ReadAllText(path);
            if (fileContent == string.Empty)
                throw new Exception($"File {path} is empty.");

            return JsonConvert.DeserializeObject<T>(fileContent);
        }

        public static void WriteJson(string path, object obj) 
        {
            File.WriteAllText(path, JsonConvert.SerializeObject(obj, Formatting.Indented));
        }
    }
}
