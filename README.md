# spdMerlin - Automatic speedtest for AsusWRT Merlin - with graphs
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/1bc89c12c4bf44b49b28161f328e49b0)](https://www.codacy.com/app/jackyaz/ntpMerlin?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=jackyaz/ntpMerlin&amp;utm_campaign=Badge_Grade)
[![Build Status](https://travis-ci.com/jackyaz/spdMerlin.svg?branch=master)](https://travis-ci.com/jackyaz/spdMerlin)

## v0.0.1
### Updated on 2019-04-01
## About
Run an NTP server for your network. Graphs available for NTP accuracy on the Tools page of the WebUI.

spdMerlin is free to use under the [GNU General Public License version 3](https://opensource.org/licenses/GPL-3.0) (GPL 3.0).

This script serves as a user-friendly installer for a project developed by [JGrana](https://www.snbforums.com/members/jgrana.20663/)

![Menu UI](https://puu.sh/D9ccG/42b28695af.png)

## Supported Models
### Models
All modes supported by [Asuswrt-Merlin](https://asuswrt.lostrealm.ca/about). Models confirmed to work are below:
*   RT-AC86U


## Installation
Using your preferred SSH client/terminal, copy and paste the following command, then press Enter:

```sh
/usr/sbin/curl --retry 3 "https://raw.githubusercontent.com/jackyaz/spdMerlin/master/spdmerlin.sh" -o "/jffs/scripts/spdmerlin" && chmod 0755 /jffs/scripts/spdmerlin && /jffs/scripts/spdmerlin install
```

## Usage
To launch the spdMerlin menu after installation, use:
```sh
spdmerlin
```

If this does not work, you will need to use the full path:
```sh
/jffs/scripts/spdmerlin
```

## Updating
Launch spdmerlin and select option u

## Help
Please post about any issues and problems here: [ntpMerlin on SNBForums](https://www.snbforums.com/threads/ntpmerlin-installer-for-kvic-ntp-daemon.55756/)

## FAQs
### I haven't used scripts before on AsusWRT-Merlin
If this is the first time you are using scripts, don't panic! In your router's WebUI, go to the Administration area of the left menu, and then the System tab. Set Enable JFFS custom scripts and configs to Yes.

Further reading about scripts is available here: [AsusWRT-Merlin User-scripts](https://github.com/RMerl/asuswrt-merlin/wiki/User-scripts)

![WebUI enable scripts](https://puu.sh/A3wnG/00a43283ed.png)