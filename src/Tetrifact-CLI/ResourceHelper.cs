using System;
using System.IO;
using System.Reflection;
using Newtonsoft.Json;

namespace TetrifactCLI
{
    public class ResourceHelper
    {
        private static string GetAssemblyName(Assembly assembly) 
        {
            string assemblyName = assembly.ManifestModule.ToString();

            if (assemblyName.Contains("."))
            {
                // clip off extension (".dll" or ".exe"), assuming there is only one "." character in executing binary name, and that 
                // is extension delimiter
                assemblyName = assemblyName.Substring(0, assemblyName.LastIndexOf("."));
            }

            return assemblyName;
        }

        public static string ReadResourceAsString(Assembly assembly, string resourceName)
        {
            string assemblyName = GetAssemblyName(assembly);
            string resourceFullName = $"{assemblyName}.{resourceName}";

            using (Stream stream = assembly.GetManifestResourceStream(resourceFullName))
            {
                if (stream == null)
                    throw new Exception($"Failed to load resource {resourceFullName} in assembly {assembly.FullName}.");

                using (StreamReader reader = new StreamReader(stream))
                    return reader.ReadToEnd();
            }
        }

        public static string ReadResourceAsString(Type typeInTargetAssembly, string resourceName)
        {
            Assembly assembly = Assembly.GetAssembly(typeInTargetAssembly);
            if (assembly == null)
                throw new Exception($"Failed to find assemby for type {typeInTargetAssembly.FullName}");

            return ReadResourceAsString(assembly, resourceName);
        }

        public static string LoadFromLocalJsonOrLocalResourceAsString(Type callerType, string resourcePath)
        {
            if (!ResourceHelper.ResourceExists(callerType, resourcePath))
            {
                Console.WriteLine($"Did not find embedded resource {resourcePath} in assembly defined by type {callerType}");
                return null;
            }

            return ResourceHelper.ReadResourceAsString(callerType, resourcePath);
        }

        public static dynamic LoadFromLocalJsonOrLocalResource(Type callerType, string resourcePath) 
        {
            string rawJson = LoadFromLocalJsonOrLocalResourceAsString(callerType, resourcePath);
            if (rawJson == null)
                return null;

            return JsonConvert.DeserializeObject(rawJson);
        }

        public static bool ResourceExists(Assembly assembly, string resourceName)
        {
            string resourceFullName = $"{assembly.GetName().Name}.{resourceName}";
            using (Stream stream = assembly.GetManifestResourceStream(resourceFullName))
                return stream != null;
        }

        public static bool ResourceExists(Type typeInTargetAssembly, string resourceName)
        {
            Assembly assembly = Assembly.GetAssembly(typeInTargetAssembly);
            if (assembly == null)
                throw new Exception($"Failed to find assemby for type {typeInTargetAssembly.FullName}");

            return ResourceExists(assembly, resourceName);
        }
    }
}