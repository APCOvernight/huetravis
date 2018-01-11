# HueTravis

[![NPM Package](https://img.shields.io/npm/v/huetravis.svg?maxAge=2592000)](https://npmjs.com/package/huetravis) ![License](https://img.shields.io/npm/l/huetravis.svg) [![Build Status](https://travis-ci.org/APCOvernight/huetravis.svg?branch=master)](https://travis-ci.org/APCOvernight/huetravis) [![Coverage Status](https://coveralls.io/repos/github/APCOvernight/huetravis/badge.svg?branch=master)](https://coveralls.io/github/APCOvernight/huetravis?branch=master) [![Maintainability](	https://img.shields.io/codeclimate/maintainability/APCOvernight/huetravis.svg)](https://codeclimate.com/github/APCOvernight/huetravis/maintainability) 
[![Dependencies](https://img.shields.io/david/APCOvernight/huetravis.svg)](https://david-dm.org/APCOvernight/huetravis) [![Greenkeeper badge](https://badges.greenkeeper.io/APCOvernight/huetravis.svg)](https://greenkeeper.io/)

Sentry reporter for HueStatus

## Features
- Set your Hue light to "working" when a build is in progress.
- Set your Hue light to "alert" when a build is failing.
- Then back to "Ok" when builds are passing

### TODO

Authentication for private builds

## Installation

```
npm install -g huestatus huetravis
```

Create a .huerc file on your home directory, see [HueStatus Docs](https://www.npmjs.com/package/huestatus) for more info. Add an object like this to the modules array for each of the projects you want to monitor:

```js
{
  "name": "huetravis", // Required to tell HueStatus to load this module
  "light": "Hue color lamp 2", // Which Hue light to use
  "repo": "", // Repo Slug
  "organisation": "", // Organisation/User slug
  "pollInterval": 2000
}
```

If you omit the repo, HueTravis will attempt to watch all repos in the organisation

Then run `huestatus`, each job will be loaded into HueStatus and your selected light(s) changed accordingly.
