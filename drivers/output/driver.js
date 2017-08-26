'use strict'

const RoonApi = require('node-roon-api')
const RoonApiStatus = require('node-roon-api-status')
const RoonApiTransport = require('node-roon-api-transport')
const RoonApiImage = require('node-roon-api-image')

const EventEmitter = require('events')

const Homey = require('homey')

class RoonEmitter extends EventEmitter {
}

class RoonOutputDriver extends Homey.Driver {

  getCore() {
    if (this.core)
      return this
    return null
  }

  onInit() {

    this.core = null
    this.zones = {}
    this.outputs = []

    this.roonEmitter = new RoonEmitter()

    this.onPairListDevices = this.onPairListDevices.bind(this)

    const pairedCondition = new Homey.FlowCardCondition('is_paired').register()
    pairedCondition.registerRunListener((args, state) => {
      return Promise.resolve(this.paired)
    })

    const pairedTrigger = new Homey.FlowCardTrigger('core_paired').register()
    const unPairedTrigger = new Homey.FlowCardTrigger('core_unpaired').register()

    // todo: retrieve version from Homey app
    //const apiVersion = Homey.ManagerApi.

    const roon = new RoonApi({
        extension_id: 'nl.mebrein.homeyroon',
        display_name: 'Athom Homey',
        display_version: '0.2.0',
        publisher: 'Merijn van Mourik',
        email: 'mmourik@gmail.com',
        log_level: 'none',
        website: 'https://github.com/mebrein/homeyroon',
        get_persisted_state: () => (Homey.ManagerSettings.get('roonstate') || {}),
        set_persisted_state: state => {Homey.ManagerSettings.set('roonstate', state)},

        core_paired: core => {
          this.log('Roon core is pairing...')
          this.core = core

          this.transport = core.services.RoonApiTransport

          this.image = core.services.RoonApiImage

          this.transport.subscribe_zones((cmd, data) => {
            if (!data) return
            if (cmd === 'Subscribed') {
              this.log(`Core found: ${core.core_id}`)

              this.zones = data.zones.reduce((result, value) => {
                result[value.zone_id] = value
                return result
              }, {})
            }
            else if (cmd = 'Changed') {
              if (data.zones_removed) {
                data.zones_removed.forEach(z => {
                  this.log('Zone removed: ' + z)
                  delete(this.zones[z])
                })
              }
              if (data.zones_added) data.zones_added.forEach(z => {
                this.log('Zone added: ' + z.zone_id)
                this.zones[z.zone_id] = z
              })
              if (data.zones_changed) {
                data.zones_changed.forEach(z => {
                  this.zones[z.zone_id] = z
                })
              }

              // in homey outputs are mapped to devices
              const newOutputs = Object.keys(this.zones).map(zoneId => this.zones[zoneId]).reduce(zoneReducer, [])

              const newOutputIds = newOutputs.map(o => o.outputId)
              const oldOutputIds = this.outputs.map(o => o.outputId)

              // find out which outputs are added
              newOutputs.forEach(o => {
                if (!oldOutputIds.includes(o.outputId)) {
                  this.log(`Output added: ${o.displayName} (${o.state}) zone ${o.zoneId} output ${o.outputId}`)
                  this.roonEmitter.emit('output_added', o.outputId)
                }
                else {
                  this.roonEmitter.emit('output_changed', JSON.stringify(o))
                }
              })

              // find out which outputs are removed
              this.outputs.forEach(o => {
                if (!newOutputIds.includes(o.outputId)) {
                  this.roonEmitter.emit('output_removed', o.outputId)
                  this.log(`Output removed: ${o.displayName} (${o.state}) zone ${o.zoneId} output ${o.outputId}`)
                } // the id of the old output is enough
              })

              this.outputs = newOutputs
            }
          })
          pairedTrigger.trigger({ core_name: core.display_name, core_version: core.display_version })
          this.log('Roon core paired successfully!')
        },

        core_unpaired: core => {
          this.log('Roon Core is unpairing...')

          unPairedTrigger.trigger({ core_name: core.display_name, core_version: core.display_version })
          this.getDevices().map(device => {
            device.setUnavailable()
          })

          this.log('Roon Core unpaired successfully.')

        }
      }
    )

    // now let's initialize Roon
    const svc_status = new RoonApiStatus(roon)
    roon.init_services({
      required_services: [RoonApiTransport, RoonApiImage],
      provided_services: [svc_status]
    })
    svc_status.set_status('All is good', false)
    roon.start_discovery()
  }

  onPairListDevices(data, callback) {
    if (!this.core)
      callback('Roon core not paired. Go to Roon - Settings - Extensions to pair/connect the device')
    const pairList = this.outputs.map(output => {
      //let capabilities = ['speaker_playing', 'speaker_next', 'speaker_prev']
      //console.log(JSON.stringify(this.zones[output.zoneId], null, 2))
      // if (output.hasVolumeControls) {
      //   this.log('VOLUMEVOLUMEVOLUMEVOLUMEVOLUMEVOLUMEVOLUMEVOLUMEVOLUMEVOLUMEVOLUMEVOLUMEVOLUMEVOLUMEVOLUME')
      //   capabilities = capabilities.concat(['volume_set', 'volume_up', 'volume_down', 'volume_mute'])
      // }
      return (
        {
          name: output.displayName,
          data: {
            id: output.outputId
          }
        }
      )
    })
    callback(null,pairList)
  }
}

// map a collection of zones to a list of unique outputs
const zoneReducer = (result, zone) => {
  if (!zone.outputs) return result
  let currentOutputsInResult = result.map(output => output.outputId)

  zone.outputs.forEach(output => {
    // check if the output is already in the result
    if (currentOutputsInResult.indexOf(output.zoneId) === -1) {
      currentOutputsInResult.push(output.zoneId)
      result = result.concat({
        outputId: output.output_id,
        zoneId: output.zone_id,
        state: zone.state,
        displayName: output.display_name,
        seekPosition: zone.now_playing ? zone.now_playing.seek_position : 0,
        length: zone.now_playing ? zone.now_playing.length : 0,
        imageKey: zone.now_playing ? zone.now_playing.image_key : '',
        oneLine: zone.now_playing ? zone.now_playing.one_line.line1 : null,
        isMuted: output.volume ? output.volume.is_muted : null,
        volumeType: output.volume ? output.volume.type : null,
        volumeMin: output.volume ? output.volume.min : null,
        volumeMax: output.volume ? output.volume.max : null,
        volumeValue: output.volume ? output.volume.value : null,
        volumeStep: output.volume ? output.volume.step : null,
        hasVolumeControls: output.volume && true
      })
    }
  })
  return result
}

module.exports = RoonOutputDriver
