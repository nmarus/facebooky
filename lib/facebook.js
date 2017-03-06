'use strict';

const EventEmitter = require('events').EventEmitter;
const util = require('util');
const when = require('when');
const request = require('request');

const validator = require('./validator');

// facebook resource methods
const messages = require('./res/messages');
const people = require('./res/people');
const webhooks = require('./res/webhooks');

/**
 * Creates a Facebook API instance that is then attached to a Facebook Account.
 *
 * @constructor
 * @param {Object.<Options>} options - Facebooky options object
 * @property {Object.<Options>} options - Facebooky options object
 *
 * @example
 * var Facebook = require('node-facebooky');
 *
 * var facebook = new Facebook({
 *   token: '<my token>',
 *   verify_token: '<verify token>',
 *   webhookSecret: 'somesecr3t',
 *   webhookReqNamespace: 'body'
 * });
 */
function Facebook(options) {
  EventEmitter.call(this);

  this.options = validator.isOptions(options) ? options : {};

  // config defaults
  this.token = process.env.TOKEN || this.options.token || null;
  this.verify_token = process.env.VERIFY_TOKEN || this.options.verify_token || null;
  this.webhookSecret = process.env.WEBHOOK_SECRET || this.options.webhookSecret || null;
  this.webhookReqNamespace = this.options.webhookReqNamespace || 'body';

  // api url
  this.apiUrl = 'https://graph.facebook.com/v2.6/';

  // attach resource methods
  messages(this);
  people(this);
  webhooks(this);
}
util.inherits(Facebook, EventEmitter);

Facebook.prototype.setToken = function(token) {
  if(typeof token === 'String') {
    this.token = token;

    return when(token);
  } else {
    return when.reject(new Error('invalid or missing arguments'));
  }
};

/**
 * Format Facebook API Call, make http request, and validate response.
 *
 * @private
 * @param {String} method
 * @param {String} resource
 * @param {String} id
 * @param {Object} data
 * @returns {Promise.<Response>}
 */
Facebook.prototype.request = function(method, resource, id, data) {
  // if token is not defined
  if(!this.token || typeof this.token !== 'string') {
    return when.reject(new Error('token not defined'));
  }

  // if verify_token is not defined
  if(!this.verify_token || typeof this.verify_token !== 'string') {
    return when.reject(new Error('verify_token not defined'));
  }

  // parse args
  let args = Array.prototype.slice.call(arguments);

  // validate method
  method = (args.length > 0) ? args.shift() : undefined;
  // validate resource
  resource = (args.length > 0) ? args.shift() : undefined;
  // validate id
  id = (args.length > 0 && typeof args[0] === 'string') ? args.shift() : undefined;
  // validate data
  data = (args.length > 0 && typeof args[0] === 'object') ? args.shift() : {};

  // if required args are defined
  if(typeof method === 'string') {
    let url = this.apiUrl;

    if(typeof resource === 'string') {
      url += resource + '/';
    }

    // define base url with optional id
    url = id ? url + id : url;

    // define headers
    let headers = {
      'Content-Type': 'application/json'
    };

    // define default request options
    let requestOptions = {
      url: url,
      headers: headers,
      time: true
    };

    // add options for "post" and "put" method
    if(method.match(/^(post|put)$/i)) {
      requestOptions.method = method;
      requestOptions.body = data;
      requestOptions.qs = {};
      requestOptions.json = true;
    }

    // add options for "get" and "delete"
    if(method.match(/^(get|delete)$/i)) {
      requestOptions.method = method;
      requestOptions.qs = data;
      requestOptions.json = true;
    }

    // add auth
    requestOptions.qs['access_token'] = this.token;

    let makeRequest = function(opts) {
      return when.promise((resolve, reject) => {
        request(opts, function(err, res) {
          if(err) {
            reject(err);
          } else if(res) {
            resolve(processResponse(res, opts));
          } else {
            reject(new Error('response not recieved'));
          }
        });
      });
    };

    let processResponse = function(res, opts) {
      let status;
      let headers;
      let body;

      // validate response
      if(!(res && typeof res === 'object')) {
        return when.reject(new Error('invalid response'));
      }

      // get/set status code
      if(res && res.hasOwnProperty('statusCode') && typeof res.statusCode === 'number') {
        status = res.statusCode;
      } else {
        status = 500;
      }

      // get/validate headers
      if(res && res.hasOwnProperty('headers') && typeof res.headers === 'object') {
        headers = res.headers;
      } else {
        return when.reject(new Error('invalid response headers'));
      }

      // if 200
      if(status === 200) {
        // get/validate body
        if(res && res.hasOwnProperty('body') && typeof res.body === 'object') {
          return when(res.body);
        } else {
          return when.reject(new Error('invalid response body'));
        }
      }

      // else other response status
      else {
        let errMessage = util.format('recieved error %s for a %s request to %s', status, opts.method.toUpperCase(), opts.url);
        console.log(errMessage);
        return when.reject(new Error(errMessage));
      }
    };

    return makeRequest(requestOptions);
  } else {
    let errMessage = 'missing required arguemnts';
    console.log(errMessage);
    return when.reject(new Error(errMessage));
  }
};

module.exports = Facebook;
