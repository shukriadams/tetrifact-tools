
using System.Net;
using System.Web;

namespace TetrifactCLI
{
    internal class WebHelper
    {
        public static string Join(string fragment1, string fragment2) 
        {
            return Join(new string[] { fragment1, fragment2});
        }

        public static string Join(string fragment1, string fragment2, string fragment3) 
        {
            return Join(new string[] { fragment1, fragment2, fragment3 });
        }

        public static string Join(string fragment1, string fragment2, string fragment3, string fragment4)
        {
            return Join(new string[] { fragment1, fragment2, fragment3, fragment4 });
        }

        public static string Join(string fragment1, string fragment2, string fragment3, string fragment4, string fragment5)
        {
            return Join(new string[] { fragment1, fragment2, fragment3, fragment4, fragment5 });
        }

        public static string Join(IList<string> fragments)
        {
            Uri url = null;
            if (fragments.Count == 0)
                return string.Empty;

            for (int i = 0; i < fragments.Count; i ++) 
            {
                string fragment = fragments[i];

                if (url == null)
                    url = new Uri(fragment);
                else
                {
                    if (!fragment.StartsWith("/"))
                        fragment = $"/{fragment}";

                    url = new Uri(url, fragment);
                }
            }

            return HttpUtility.UrlEncode(url.ToString());
        }

        /// <summary>
        /// Gets http status of endpoint, throws exception if 
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public static string GetStatus(string url)
        {
            HttpClient client = new HttpClient();
            client.SendAsync(new HttpRequestMessage(HttpMethod.Head, url));
            HttpResponseMessage response = client.GetAsync(url).GetAwaiter().GetResult();

            KeyValuePair<string, IEnumerable<string>>? statusHeader = response.Headers.FirstOrDefault(r => r.Key == "STATUS");
            if (statusHeader.HasValue)
                return string.Join("", statusHeader.Value.Value);

            throw new Exception($"Failed to read header from {url}");
        }
    }
}
