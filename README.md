# Roon
Control [Roon](https://roonlabs.com/) from your Homey.

# Functionality
This app is paired with the Roon core. It can trigger a flow when a Roon core is turned on. Or lets you
retrieve the song title when advancing to the next song. The cover art image of the current song can be retrieved, it will be provided to you as an url.
This way you can trigger your chromecast and have your cover art on your television screen. When you point your webbrowser to
the following url: http://hour-homey-ip/app/nl.mebrein.homeyroon, it will display the coverart of the
first zone/output it finds.

# Usage
To be able to use this app:
- install the app
- add a device (for each roon output there will be a device)
- make a new flow, and use the Roon app card and/or the Roon device card
- the following settings are available:
    - size of the cover art image capture
    - the maximum volume allowed to be set from Homey (not yet in use)

# Additional info
Additional info:
- this app is built upon the Roon api, provided by [Roonlabs](https://github.com/RoonLabs/node-roon-api)
- if you like something changed/improved please submit an issue in this app's repository
- this software is built by enthousiasts, it will be provided as is, with no warranty or whatsoever
- if you would like to help you are invited to send your pull requests to github
- by using this app, the Athom Homey, or Roon, you accept that you and only you are responsible
  to any damages that might occur to your equipment. (eg. damages that may occur by setting the volume to a
  very high level)

# Backlog
The following functionality is planned
- implement volume controls (mute already works)
- implement custom actions 'stop' and 'convenience switch'
- group zones
- transfer song to/from spotify
- trigger directly to a chromecast
- action for turning in on a radio stream on Roon

# Version history
0.2.1
fixed link to github
incorporated bugfix from node-roon-api and node-roon-api-transport

0.2.0
better image for appstore
settings implemented
prev/next/pause/play controls implemented
device state in Homey better reflects output state

0.1.0
initial version