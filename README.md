# Roon
Control [Roon](https://roonlabs.com/) from your Homey.

# Functionality
This app is paired with the Roon core. It can trigger a flow when Roon is turned on. Or lets you
retrieve the song title when a song changes. The image of the current song playing can be exported.
The url/location of the image will also be available, so you can send this to your Chromecast. This way
you can display the current cover art on your television screen. You can point a webbrowser to
the following url: http://hour-homey-ip/app/nl.mebrein.homeyroon, it will display the coverart of the
first zone/output it finds.

# Usage
To be able to use this app:
- install the app
- add a device (for each zone there will be a device)
- make a new flow, and use the app card and/or the device card
- the following settings are available:
    - the maximum volume allowed to be set from Homey (not yet in use)
    - size of the cover art image capture

# Additional info
Additinonal info:
- this app is built upon the Roon api, provided by [Roonlabs](https://github.com/RoonLabs/node-roon-api)
- if you like something changed/improved please submit an issue in this app's repository
- this software is built by enthousiasts, it will be provided as is, with no warranty or whatsoever
- by using this app, the Athom Homey, or Roon, you accept that you and only you are responsible
  to any damages that might occur to your equipment. (eg. damages that may occur by setting the volume to a
  very high level)

# Known issues
When adding a Roon output device, if no device is listed: play some music then the device will show up

# Backlog
The following functionality is planned
- implement volume controls (mute already works)
- implement custom actions 'stop' and 'convenience switch'
- implement device card
- image: only trigger when album changes, and not with change of every song
- group zones
- transfer song to/from spotify
- trigger directly to a chromecast
- action for turning in on a radio stream on Roon

# Version history
0.2.0 - several improvements
better artwork for the appstore
settings implemented
more controls implemented

0.1.0 - initial version
initial version