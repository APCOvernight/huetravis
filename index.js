let BaseModule

try {
  BaseModule = require(require('requireg').resolve('huestatus/src/Module'))
} catch (e) {
  throw new Error('A HueStatus installation is required -- npm install -g huestatus')
}

const Travis = require('travis-ci')

class HueTravis extends BaseModule {
  /**
   * Generate instance name based on repo and repo
   * @return {String} [description]
   */
  generateInstanceName () {
    return `Travis: ${this.config.organisation}/${this.config.repo || '*'}`
  }

  /**
   * Start method, called on huestatus start. Loops through api polling
   */
  async start () {
    this._setUpConfig()
    setInterval(this._pollTravis.bind(this), this.config.pollInterval || 2000)
  }

  /**
   * Check for config variables and create Travis API Client
   * @throws error when required config value is not set
   */
  _setUpConfig () {
    ['organisation'].map(configItem => {
      if (!this.config[configItem]) {
        throw new Error(`Travis ${configItem} config value not set`)
      }
    })

    this.travis = new Travis({ version: '2.0.0' })
  }

  /**
   * Make a request to the travis API, check for unresolved issues, then filter out already assigned issues
   * @return {Promise}
   */
  async _pollTravis () {
    if (!this.config.repo) {
      return this._pollAll()
    }
    return this._pollSingle()
  }

  /**
   * Make a request to the travis API, check for unresolved issues, then filter out already assigned issues
   * @return {Promise}
   */
  async _pollSingle () {
    const res = await new Promise((resolve, reject) => {
      this.travis.repos(this.config.organisation, this.config.repo).get((err, res) => {
        if (err) {
          reject(err)
        }
        resolve(res)
      })
    })

    return this.repoReport(res.repo)
  }

  /**
   * Make a request to the travis API, check for unresolved repos, then filter out already assigned repos
   * @return {Promise}
   */
  async _pollAll () {
    const res = await new Promise((resolve, reject) => {
      this.travis.repos(this.config.organisation).get((err, res) => {
        if (err) {
          reject(err)
        }
        resolve(res)
      })
    })

    const activeRepos = res.repos.filter(repo => repo.active)

    let array = []

    array = array.concat(activeRepos.filter(repo => repo.last_build_state === 'failed'))
    array = array.concat(activeRepos.filter(repo => ['created', 'started'].includes(repo.last_build_state)))
    array = array.concat(activeRepos.filter(repo => !['created', 'started', 'passed', 'failed'].includes(repo.last_build_state)))
    array = array.concat(activeRepos.filter(repo => repo.last_build_state === 'passed'))

    return this.repoReport(array[0])
  }

  async repoReport (repo) {
    if (repo.last_build_state === 'failed') {
      return this.change('alert', `${repo.slug} Failing`)
    }

    if (repo.last_build_state === 'passed') {
      return this.change('ok', `${repo.slug} Passing`)
    }

    if (['created', 'started'].includes(repo.last_build_state)) {
      return this.change('working', `${repo.slug} Building`)
    }

    return this.change('warning', `${repo.slug} ${repo.last_build_state || 'Unknown Status'}`)
  }
}

module.exports = HueTravis
