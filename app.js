'use strict'

const Homey = require('homey')

class RoonApp extends Homey.App {

  onInit() {

    this.log('The Roon app is starting up......')
  }
}

module.exports = RoonApp