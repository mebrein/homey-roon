const Homey = require('homey')

module.exports = [
  {
    method: 'GET',
    path: '/',
    public: true,
    fn: (args, callback)=>{
      const result = 'hi'
      Homey.app.test()
      callback(null, result)
    }
  },
  {
    method: 'GET',
    path: '/outputs',
    public: true,
    fn: (args, callback)=>{
        callback(null, Homey.ManagerDrivers.getDriver('output').outputs.map(output=>output.outputId))
    }
  },
]