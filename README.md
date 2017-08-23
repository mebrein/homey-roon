# Roon
App for Homey that lets you control Roon.

# Functionality
This app is paired with a Roon core. It can trigger a flow when Roon is turned on,
or when a song changes. When a song changes, the current song (artist/name) can be used.
Also there is an url which you eg. can send to your Chromecast to display the cover art on your television.
Or point a web browser to http://hour-homey-ip/app/nl.mebrein.homeyroon, it will display the coverart of the
first zone it finds.

# Usage
To be able to use this app:
- install the app
- add a device (for each zone there will be a device)
- make a new flow, and use the app card and/or the device card
- play with the settings:
    - size of the cover art image being captured
    - the maximum volume allowed (initially set to max 50%...)

# Remarks
Please not the following
- this app is built on the Roon api, provided by [Roonlabs](https://github.com/RoonLabs/node-roon-api)
- if you like to contribute please feel invited, or send your pull request
- this app is built by enthousiasts, it will be provided as is, with no warranty or whatsoever
- you are responsible of managing the volume of the device, by using this app you take responsiblity
  in providing the correct volume level to your device, any damages that might be occur are at your
  own risk

# Backlog
This app is still in development. The following things are being worked on
- extra icons
- implement settings
- settings: maximum volume
- implement volume controls
- implement actions play/pause/prev/next on output/zone
- possibility to group zones
- transfer song to/from spotify
- trigger directly to a chrome cast
- trigger a radio stream
- settings: size of exported cover art

# Version history
0.1.0 - initial version
0.2.0 - beta
