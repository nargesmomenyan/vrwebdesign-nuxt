const path = require('path')
const consola = require('consola')
const logger = consola.withScope('nuxt:axios')
const fs = require('fs')

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex
}

function axiosModule(_moduleOptions) {
  // Combine options
  const moduleOptions = { ...this.options.axios, ..._moduleOptions }

  // Default port
  const defaultPort =
    process.env.API_PORT ||
    moduleOptions.port ||
    process.env.PORT ||
    process.env.npm_package_config_nuxt_port ||
    3000

  // Default host
  let defaultHost =
    process.env.API_HOST ||
    moduleOptions.host ||
    process.env.HOST ||
    process.env.npm_package_config_nuxt_host ||
    'localhost'

  /* istanbul ignore if */
  if (defaultHost === '0.0.0.0') {
    defaultHost = 'localhost'
  }

  // Default prefix
  const prefix = process.env.API_PREFIX || moduleOptions.prefix || '/'

  // Apply defaults
  const options = {
    baseURL: `http://${defaultHost}:${defaultPort}${prefix}`,
    browserBaseURL: null,
    credentials: false,
    debug: false,
    progress: true,
    proxyHeaders: true,
    proxyHeadersIgnore: ['accept', 'host', 'cf-ray', 'cf-connecting-ip'],
    proxy: false,
    retry: false,
    https: false,
    ...moduleOptions
  }

  // ENV overrides

  /* load services */
  let services = {}
  var service_path = path.join(this.options.rootDir, 'services')
  if (fs.existsSync(service_path)) {
    // Do something
    fs.readdirSync(service_path).forEach(function (file) {
      if (file.includes('.ts') || file.includes('.js')) {
        var file_path = path.join(service_path, file)
        delete require.cache[require.resolve(file_path)]
        
        //  to have this service in services
        const serviceName = file.replace(/\.(js|ts)/, '');
        services[serviceName] = serviceName;
      }
    })
  }
  options.services = services
  /* istanbul ignore if */
  if (process.env.API_URL) {
    options.baseURL = process.env.API_URL
  }

  /* istanbul ignore if */
  if (process.env.API_URL_BROWSER) {
    options.browserBaseURL = process.env.API_URL_BROWSER
  }

  // Default browserBaseURL
  if (!options.browserBaseURL) {
    options.browserBaseURL = options.proxy ? prefix : options.baseURL
  }

  // Normalize options
  if (options.retry === true) {
    options.retry = {}
  }

  // Convert http:// to https:// if https option is on
  if (options.https === true) {
    const https = s =>
      s.indexOf('//localhost:') > -1 ? s : s.replace('http://', 'https://')
    options.baseURL = https(options.baseURL)
    options.browserBaseURL = https(options.browserBaseURL)
  }

  // Register plugin
  this.addPlugin({
    src: path.resolve(__dirname, 'plugin.js'),
    fileName: 'axios.js',
    options
  })

  // Proxy integration
  if (options.proxy) {
    this.requireModule([
      '@nuxtjs/proxy',
      typeof options.proxy === 'object' ? options.proxy : {}
    ])
  }

  // Set _AXIOS_BASE_URL_ for dynamic SSR baseURL
  process.env._AXIOS_BASE_URL_ = options.baseURL

  logger.debug(`baseURL: ${options.baseURL}`)
  logger.debug(`browserBaseURL: ${options.browserBaseURL}`)
}

module.exports = axiosModule
module.exports.meta = require('../package.json')
