/* eslint-disable no-unused-expressions */

const chai = require('chai')
chai.use(require('sinon-chai'))
const expect = chai.expect
const sinon = require('sinon')
const HueTravis = require('../')

let mockConfig
let huetravis
let travisStub
let changeStub

describe('HueTravis Class', function () {
  beforeEach(() => {
    mockConfig = {
      name: 'huetravis',
      repo: 'myProject',
      organisation: 'myOrg',
      pollInterval: 5000,
      light: 'Hue color lamp 2'
    }

    huetravis = new HueTravis(mockConfig, {})
  })

  it('It should set up the travis api client', async () => {
    expect(huetravis.config).to.be.an('object')
    expect(huetravis.travis).to.be.undefined

    huetravis._setUpConfig()

    expect(huetravis.travis).to.be.an('object')
  })

  it('Errors cascade up', async () => {
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()
    huetravis.travis.request

    travisStub = sinon.stub(huetravis.travis.agent, 'request').callsArgWith(3, new Error('Some Error'))
    changeStub = sinon.stub(huetravis, 'change').resolves(true)

    try {
      await huetravis._pollTravis()
      expect(true).to.be.false
    } catch (e) {
      expect(e.message).to.equal('Some Error')
    }

    expect(travisStub).to.be.calledWith('GET', '/repos/myOrg/myProject')
    expect(changeStub).to.not.be.called

    travisStub.restore()
    changeStub.restore()
  })

  it('Errors cascade up - pollAll', async () => {
    mockConfig.repo = null
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()
    huetravis.travis.request

    travisStub = sinon.stub(huetravis.travis.agent, 'request').callsArgWith(3, new Error('Some Error'))
    changeStub = sinon.stub(huetravis, 'change').resolves(true)

    try {
      await huetravis._pollTravis()
      expect(true).to.be.false
    } catch (e) {
      expect(e.message).to.equal('Some Error')
    }

    expect(travisStub).to.be.calledWith('GET', '/repos/myOrg')
    expect(changeStub).to.not.be.called

    travisStub.restore()
    changeStub.restore()
  })

  it('It should set status to warning if all builds are unknown', async () => {
    mockConfig.repo = null
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()
    huetravis.travis.request

    travisStub = sinon.stub(huetravis.travis.agent, 'request').callsArgWith(3, null, {
      repos: [
        {
          active: true,
          last_build_state: 'unstable',
          slug: 'MyRepo'
        },
        {
          active: true,
          last_build_state: 'passed',
          slug: 'AnotherRepo'
        }
      ]
    })
    changeStub = sinon.stub(huetravis, 'change').resolves(true)

    await huetravis._pollTravis()

    expect(travisStub).to.be.calledWith('GET', '/repos/myOrg')
    expect(changeStub).to.be.calledOnce
    expect(changeStub).to.be.calledWith('warning', 'MyRepo unstable')

    travisStub.restore()
    changeStub.restore()
  })

  it('It should set status to working if all builds are passing', async () => {
    mockConfig.repo = null
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()
    huetravis.travis.request

    travisStub = sinon.stub(huetravis.travis.agent, 'request').callsArgWith(3, null, {
      repos: [
        {
          active: true,
          last_build_state: 'started',
          slug: 'MyRepo'
        },
        {
          active: true,
          last_build_state: 'passed',
          slug: 'AnotherRepo'
        }
      ]
    })
    changeStub = sinon.stub(huetravis, 'change').resolves(true)

    await huetravis._pollTravis()

    expect(travisStub).to.be.calledWith('GET', '/repos/myOrg')
    expect(changeStub).to.be.calledOnce
    expect(changeStub).to.be.calledWith('working', 'MyRepo Building')

    travisStub.restore()
    changeStub.restore()
  })

  it('It should set status to ok if builds are failing', async () => {
    mockConfig.repo = null
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()
    huetravis.travis.request

    travisStub = sinon.stub(huetravis.travis.agent, 'request').callsArgWith(3, null, {
      repos: [
        {
          active: true,
          last_build_state: 'failed',
          slug: 'MyRepo'
        },
        {
          active: true,
          last_build_state: 'passed',
          slug: 'AnotherRepo'
        }
      ]
    })
    changeStub = sinon.stub(huetravis, 'change').resolves(true)

    await huetravis._pollTravis()

    expect(travisStub).to.be.calledWith('GET', '/repos/myOrg')
    expect(changeStub).to.be.calledOnce
    expect(changeStub).to.be.calledWith('alert', 'MyRepo Failing')

    travisStub.restore()
    changeStub.restore()
  })

  it('It should set status to ok if all builds are passing', async () => {
    mockConfig.repo = null
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()
    huetravis.travis.request

    travisStub = sinon.stub(huetravis.travis.agent, 'request').callsArgWith(3, null, {
      repos: [
        {
          active: true,
          last_build_state: 'passed',
          slug: 'MyRepo'
        },
        {
          active: true,
          last_build_state: 'passed',
          slug: 'AnotherRepo'
        }
      ]
    })
    changeStub = sinon.stub(huetravis, 'change').resolves(true)

    await huetravis._pollTravis()

    expect(travisStub).to.be.calledWith('GET', '/repos/myOrg')
    expect(changeStub).to.be.calledOnce
    expect(changeStub).to.be.calledWith('ok', 'MyRepo Passing')

    travisStub.restore()
    changeStub.restore()
  })

  it('It should set status to working if a build is unknown', async () => {
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()
    huetravis.travis.request

    travisStub = sinon.stub(huetravis.travis.agent, 'request').callsArgWith(3, null, {
      repo: {
        active: true,
        last_build_state: null,
        slug: 'MyRepo'
      }
    })
    changeStub = sinon.stub(huetravis, 'change').resolves(true)

    await huetravis._pollTravis()

    expect(travisStub).to.be.calledWith('GET', '/repos/myOrg/myProject')
    expect(changeStub).to.be.calledWith('warning', 'MyRepo Unknown Status')

    travisStub.restore()
    changeStub.restore()
  })

  it('It should set status to working if a build is passing', async () => {
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()
    huetravis.travis.request

    travisStub = sinon.stub(huetravis.travis.agent, 'request').callsArgWith(3, null, {
      repo: {
        active: true,
        last_build_state: 'started',
        slug: 'MyRepo'
      }
    })
    changeStub = sinon.stub(huetravis, 'change').resolves(true)

    await huetravis._pollTravis()

    expect(travisStub).to.be.calledWith('GET', '/repos/myOrg/myProject')
    expect(changeStub).to.be.calledWith('working', 'MyRepo Building')

    travisStub.restore()
    changeStub.restore()
  })

  it('It should set status to ok if a build is failing', async () => {
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()
    huetravis.travis.request

    travisStub = sinon.stub(huetravis.travis.agent, 'request').callsArgWith(3, null, {
      repo: {
        active: true,
        last_build_state: 'failed',
        slug: 'MyRepo'
      }
    })
    changeStub = sinon.stub(huetravis, 'change').resolves(true)

    await huetravis._pollTravis()

    expect(travisStub).to.be.calledWith('GET', '/repos/myOrg/myProject')
    expect(changeStub).to.be.calledWith('alert', 'MyRepo Failing')

    travisStub.restore()
    changeStub.restore()
  })

  it('It should set status to ok if a build is passing', async () => {
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()
    huetravis.travis.request

    travisStub = sinon.stub(huetravis.travis.agent, 'request').callsArgWith(3, null, {
      repo: {
        active: true,
        last_build_state: 'passed',
        slug: 'MyRepo'
      }
    })
    changeStub = sinon.stub(huetravis, 'change').resolves(true)

    await huetravis._pollTravis()

    expect(travisStub).to.be.calledWith('GET', '/repos/myOrg/myProject')
    expect(changeStub).to.be.calledWith('ok', 'MyRepo Passing')

    travisStub.restore()
    changeStub.restore()
  })

  it('Should throw when config variable is missing', () => {
    mockConfig.organisation = undefined
    const huetravis = new HueTravis(mockConfig, {})
    expect(() => { huetravis._setUpConfig() }).to.throw('Travis organisation config value not set')
  })

  it('Should generate instance name based on org and project', () => {
    const huetravis = new HueTravis(mockConfig, {})
    expect(huetravis.instanceName).to.equal('Travis: myOrg/myProject')
  })

  it('Should poll every x seconds', async () => {
    this.clock = sinon.useFakeTimers()
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()

    sinon.stub(huetravis, '_pollTravis')

    await huetravis.start()

    this.clock.tick(3000)

    expect(huetravis._pollTravis).to.not.be.called

    this.clock.tick(3000)

    expect(huetravis._pollTravis).to.be.calledOnce

    this.clock.tick(3000)

    expect(huetravis._pollTravis).to.be.calledOnce

    this.clock.tick(3000)

    expect(huetravis._pollTravis).to.be.calledTwice

    this.clock.restore()
  })

  it('Poll every 2 seconds by default', async () => {
    this.clock = sinon.useFakeTimers()
    mockConfig.pollInterval = undefined
    const huetravis = new HueTravis(mockConfig, {})
    huetravis._setUpConfig()

    sinon.stub(huetravis, '_pollTravis')

    await huetravis.start()

    this.clock.tick(1200)

    expect(huetravis._pollTravis).to.not.be.called

    this.clock.tick(1200)

    expect(huetravis._pollTravis).to.be.calledOnce

    this.clock.tick(1200)

    expect(huetravis._pollTravis).to.be.calledOnce

    this.clock.tick(1200)

    expect(huetravis._pollTravis).to.be.calledTwice

    this.clock.restore()
  })

  it('Should throw an error when HueStatus is not found', () => {
    delete require.cache[require.resolve('requireg')]
    delete require.cache[require.resolve('../')]
    const requiregStub = sinon.stub(require('requireg'), 'resolve').throws('Not found')

    expect(() => { require('../') }).to.throw('A HueStatus installation is required -- npm install -g huestatus')

    requiregStub.restore()
  })
})
