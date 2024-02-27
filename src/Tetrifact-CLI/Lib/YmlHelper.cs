using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace TetrifactCLI
{
    public class YmlHelper
    {
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        public static IDeserializer GetDeserializer()
        {
            return new DeserializerBuilder()
                .WithNodeDeserializer(new KeyValueDeserializer())
                .WithNamingConvention(CamelCaseNamingConvention.Instance)
                .IgnoreUnmatchedProperties()
                .Build();
        }

        public static ISerializer GetSerializer()
        {
            return new SerializerBuilder()
                .ConfigureDefaultValuesHandling(DefaultValuesHandling.OmitNull)
                .Build();
        }
    }
}
