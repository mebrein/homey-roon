'use strict'

const fs = require('fs')
const path = require('path')

const Homey = require('homey')

class RoonOutputDevice extends Homey.Device {

  async onInit() {
    this.log('device init')
    this.log('name:', this.getName())
    this.log('class:', this.getClass())

    // communication with roon
    this.outputChanged = this.outputChanged.bind(this)
    this.outputAdded = this.outputAdded.bind(this)
    this.outputRemoved = this.outputRemoved.bind(this)

    // add the listeners
    this.registerCapabilityListener('speaker_playing', this.onCapabilitySpeakerPlaying.bind(this)) //play/pause
    this.registerCapabilityListener('speaker_next', this.onCapabilitySpeakerNext.bind(this))
    this.registerCapabilityListener('speaker_prev', this.onCapabilitySpeakerPrev.bind(this))
    //this.registerCapabilityListener('volume_set', this.onCapabilityVolumeSet.bind(this))
    //this.registerCapabilityListener('volume_up', this.onCapabilityVolumeUp.bind(this))
    //this.registerCapabilityListener('volume_down', this.onCapabilityVolumeDown.bind(this))
    this.registerCapabilityListener('volume_mute', this.onCapabilityVolumeMute.bind(this))

    this.songChangeTrigger = await new Homey.FlowCardTriggerDevice('song_change').register()

    this.getDriver().roonEmitter
      .on('output_added', this.outputAdded)
      .on('output_removed', this.outputRemoved)
      .on('output_changed', this.outputChanged)

  }

  onAdded() {
    this.log('device added')
  }

  onDeleted() {
    // remove the listeners
    this.getDriver().roonEmitter
      .removeListener('zone_added', this.outputAdded)
      .removeListener('zone_removed', this.outputRemoved)
      .removeListener('zone_changed', this.outputChanged)
    this.log('device deleted')
  }

  onCapabilitySpeakerPlaying(value, opts, callback) {
    const action = value ? 'play' : 'pause'
    this.getDriver().transport.control(this.getData().id, action, err => {
      if (err) {
        return Promise.reject(new Error('Setting speaker playing to ' + action + ' failed!' + err))
      }
      callback(null)
    })
  }

  onCapabilitySpeakerNext(value, opts, callback) {
    this.getDriver().transport.control(this.getData().id, 'next', err => {
      if (err) {
        return Promise.reject(new Error('Advance to next track failed!' + err))
      }
      callback(null)
    })
  }

  onCapabilitySpeakerPrev(value, opts, callback) {
    this.getDriver().transport.control(this.getData().id, 'previous', err => {
      if (err) {
        return Promise.reject(new Error('Going back to previous track failed!' + err))
      }
      callback(null)
    })
  }

  onCapabilityVolumeSet(value, opts, callback) {
    callback(null)
    // this.getDriver().transport.change_volume('output', 'absolute', 0, (err) => {
    //   if (err) {
    //     return Promise.reject(new Error('Setting volume on the output failed!' + err))
    //   }
    //   callback(null)
    // })
  }

  onCapabilityVolumeUp(value, opts, callback) {
    callback(null)
    // this.getDriver().transport.change_volume('output', 'relative', 1, (err) => {
    //   if (err) {
    //     return Promise.reject(new Error('Volume up failed!' + err))
    //   }
    //   callback(null)
    // })
  }

  onCapabilityVolumeDown(value, opts, callback) {
    callback(null)
    // this.getDriver().transport.change_volume('output', 'relative', -1, (err) => {
    //   if (err) {
    //     return Promise.reject(new Error('Volume down failed!' + err))
    //   }
    //   callback(null)
    // })
  }

  onCapabilityVolumeMute(value, opts, callback) {
    const action = value ? 'mute' : 'unmute'
    this.getDriver().transport.mute(this.getData().id, action, err => {
      if (err) {
        return Promise.reject(new Error('Muting the output failed!' + err))
      }
      callback(null)
    })
  }

  outputAdded(outputId) {
    if (outputId === this.getData().id)
      this.setAvailable()
  }

  outputRemoved(outputId) {
    if (outputId === this.getData().id)
      this.setUnavailable()
  }

  async outputChanged(o) {
    try {
      const output = JSON.parse(o)

      if (!(output.outputId === this.getData().id)) return

      const zoneId = output.zoneId
      this.setStoreValue('zoneId', zoneId)

      this.log(`${output.displayName} (${output.state})`)

      if (output.hasOwnProperty('isMuted')) {
        const isMuted = output.isMuted
        if (this.getCapabilityValue('volume_mute') !== isMuted)
          await this.setCapabilityValue('volume_mute', isMuted)
      }

      if (!(output.oneLine))
        return

      const newSong = output.oneLine

      if (this.getStoreValue('nowPlaying') === newSong)
        return

      // prepare for triggering the song change event

      // if the device is just coming online, don't trigger the first time
      // (give the end user room to breathe ;-)
      // then next time the song changes it will trigger

      if (this.getStoreValue('nowPlaying') === '') {
        // this case do nothing, since it is just started
        // next update everything will be ok
        await this.setStoreValue('nowPlaying', newSong)
        return
      }

      this.log(`Old song: ${this.getStoreValue('nowPlaying')}`)
      this.log(`New song: ${newSong}`)

      await this.setStoreValue('nowPlaying', newSong)

      if (!(output.state === 'playing' || output.state === 'loading'))
        return

      // get the cover art of the current song
      // todo: make more efficient. only do this when the cover art changed to save
      const buffer = await this.getImage(output.imageKey)
      this.log('Retrieved image from Roon')

      // construct a path for the homey web interface
      const imagePath = path.join(__dirname, '../../userdata', output.outputId + '.jpg')

      // write the image to disk, overwrite the old image
      await this.writeFile(imagePath, buffer, 'binary')
      this.log(`Image saved to ${imagePath}!`)

      // register the image to Homey
      let i = new Homey.Image('jpg')
      i.setPath(imagePath)
      await i.register()
      this.log('Image registered')

      await this.songChangeTrigger.trigger(this, {
        'now_playing': newSong,
        'cover_image': i,
        'image_url': 'http://' + this.getIpAddress() + '/app/nl.mebrein.homeyroon/?output=' + output.outputId
      })
      this.log('Fired songChangeTrigger')
    }
    catch (err) {
      this.log('An error occurred while receiving data for roon output: ', err)
    }
  }

  getImage(image_key) {
    const widthSetting = Homey.ManagerSettings.get('coverArtWidth')
    const heightSetting = Homey.ManagerSettings.get('coverArtHeight')

    // TODO: refactor this
    let width = 720
    let height = 720

    try {
      width = Number(widthSetting)
      height = Number(heightSetting)
    }
    catch (err) {
      width = 720
      height = 720
    }

    if (width === 0)
      width = 720
    if (height === 0)
      height = 720

    return new Promise((resolve, reject) => {
      this.getDriver().image.get_image(
        image_key,
        {
          scale: 'fit',
          width: width,
          height: height,
          format: 'image/jpeg'
        },
        (err, contentType, buffer) => {
          if (err)
            reject(err)
          resolve(buffer)
        })
    })
  }

  writeFile(fileName, fileContent) {
    return new Promise((resolve, reject) => {
      fs.writeFile(fileName, fileContent, 'binary', err => {
        if (err)
          reject(err)
        resolve('File written')
      })
    })
  }

  getIpAddress() {
    // get ip address
    const ifaces = require('os').networkInterfaces()
    let address = ''

    Object.keys(ifaces).forEach(dev => {
      ifaces[dev].filter(details => {
        if (details.family === 'IPv4' && details.internal === false) {
          address = details.address
        }
      })
    })
    return address
  }
}

module.exports = RoonOutputDevice