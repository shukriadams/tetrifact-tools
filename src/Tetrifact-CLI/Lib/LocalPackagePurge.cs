using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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



        }
    }
}
