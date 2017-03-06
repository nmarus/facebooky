'use strict';

const crypto = require('crypto');
const moment = require('moment');
const when = require('when');
const url = require('url');
const qs = require('querystring');
const _ = require('lodash');

const validator = require('../validator');

// xor function
const xor = function(a,b) {
  return (a || b) && !(a && b);
};

module.exports = function(Facebook) {

  /**
   * Authenticate X-Hub-Signature HMAC-SHA1 Hash.
   *
   * @function
   * @param {String} secret - Value of secret used when creating webhook
   * @param {String} signature - Value of "X-Hub-Signature" from header
   * @param {(String|Object)} payload - This can either be the json object or a string representation of the webhook's body json payload
   * @returns {Promise.String|Object} payload
   *
   * @example
   * let sig = req.headers['x-hub-signature'];
   * let secret = 'mySecret';
   *
   * facebook.webhookAuth(secret, sig, req.body)
   *   .then(function() {
   *     // webhook is valid
   *   })
   *   .catch(function(err) {
   *     // webhook is invalid
   *   });
   */
  Facebook.webhookAuth = function(secret, sig, payload) {
    // promisfy JSON.stringify()
    let jsonStringify = when.lift(JSON.stringify);

    let strPayload;
    // if object
    if(typeof payload === 'object') {
      strPayload = jsonStringify(payload);
    }
    // else if string
    else if(typeof payload === 'string') {
      strPayload = when(payload);
    }
    // else if other
    else {
      strPayload = when.reject(new Error('invalid payload'));
    }

    //validate
    if(typeof sig === 'string' && typeof secret === 'string') {
      let hmac = crypto.createHmac('sha1', secret);

      return when(strPayload)
        .then(pl => {
          hmac.update(pl);
          if(sig === 'sha1=' + hmac.digest('hex')) {
            return when(payload);
          } else {
            return when.reject(new Error('received an invalid payload'));
          }
        });
    } else {
      return when.reject(new Error('received a request with missing or invalid function arguments'));
    }
  };

  /**
   * Process request from connect, express, or resitify routes. Return function
   * that accepts req, res, and next arguments.
   *
   * @returns {Facebook.webhookListen~webhookHandler} function
   *
   * @example
   * "use strict";
   *
   * const Facebook = require('node-facebooky');
   * const express = require('express');
   * const bodyParser = require('body-parser');
   * const path = require('path');
   *
   * const facebook = new Facebook({
   *   token: '<fb token>',
   *   verify_token: '<fb verify token>',
   *   webhookSecret: '<fb app/webhook secret>',
   *   webhookReqNamespace: 'body'
   * });
   *
   * // add events
   * facebook.on('messages', function(event, message, req) {
   *   if(event === 'created') {
   *     facebook.personGet(message.personId)
   *       .then(function(person) {
   *         console.log('%s said %s', person.displayName, message.text);
   *       })
   *       .catch(function(err) {
   *         console.log(err);
   *       });
   *   }
   * });
   *
   * const app = express();
   * app.use(bodyParser.json());
   *
   * // add route for path that which is listening for web hooks
   * app.use('/webhook', facebook.webhookListen());
   *
   * // start express server
   * const server = app.listen('3000', function() {
   *   console.log('Listening on port %s', '3000');
   * });
   */
  Facebook.webhookListen = function() {

    /**
     * Function returned by facebook.webhookListen()
     *
     * @param {Object} req - request object
     * @param {Object} [res] - response object
     * @param {Function} [next] - next function
     */
    let webhookHandler = function(req, res, next) {
      // promisfy JSON.stringify()
      let jsonStringify = when.lift(JSON.stringify);

      // promisfy JSON.parse()
      let jsonParse = when.lift(JSON.parse);

      // process webhook body object
      let processBody = function(bodyObj) {
        // get entry array
        let entries = bodyObj.entry;

        /**
         * Webhook request event
         *
         * @event request
         * @type object
         * @property {Object.<Request>} req - Full Request Object
         */
         Facebook.emit('request', req);

        // process entries
        _.forEach(entries, entry => {
          /**
           * Webhook entry event
           *
           * @event entry
           * @type object
           * @property {Object.<Entry>} entry - Entry Object (https://developers.facebook.com/docs/messenger-platform/webhook-reference#format)
           */
          Facebook.emit('entry', entry);

          _.forEach(entry.messaging, event => {
            // event
            Facebook.emit('event', event);

            // messages
            if(event.message && event.message.text) {
              let message = {
                id: event.message.mid,
                text: event.message.text,
                personId: event.sender.id,
                created: moment(event.message.timestamp, 'x').format()
              };

              /**
               * Webhook messages event
               *
               * @event messages
               * @type object
               * @property {String} event - Triggered event (created)
               * @property {Object.<Message>} message - Message Object found in Webhook
               * @property {Object.<Request>} req - Full Request Object
               */
              Facebook.emit('messages', 'created', message, req);
            }
          });
        });
      };

      // validate "req"
      if(req
        && req.hasOwnProperty('method')
        && req.hasOwnProperty('headers')
        && req.hasOwnProperty(Facebook.webhookReqNamespace)
        && Facebook.verify_token
        && Facebook.token
      ) {
        // if req is from facebook token verification
        if(req.method === 'GET' && typeof res !== 'undefined') {
          let query = qs.parse(url.parse(req.url).query);

          if(query['hub.verify_token'] === Facebook.verify_token) {
            res.status(200);
            return res.send(query['hub.challenge']);
          } else {
            res.status(200);
            return res.send('invalid validation token');
          }
        }

        // else, if req is webhook
        else if(req.method === 'POST') {
          // always respond OK if res is defined
          if(typeof res !== 'undefined') {
            res.status(200);
            res.send('OK');
          }

          // headers
          let headers = req.headers;

          // body
          let body = {};
          // if body data type is object
          if(typeof req[Facebook.webhookReqNamespace] === 'object') {
            body = when(req[Facebook.webhookReqNamespace]);
          }
          // else if body data type is string
          else if(typeof req[Facebook.webhookReqNamespace] === 'string') {
            body = jsonParse(req[Facebook.webhookReqNamespace]);
          }

          // hmac signature
          let sig = headers.hasOwnProperty('x-hub-signature') ? headers['x-hub-signature'] : null;

          if(sig && Facebook.webhookSecret) {
            when(body)
              .then(bodyObj => Facebook.webhookAuth(Facebook.webhookSecret, sig, bodyObj))
              .then(bodyObj => {
                processBody(bodyObj);
              })
              .catch(err => {
                console.log('node-facebooky/webhooks %s', err.message);
              });
          }

          else if(xor(sig, Facebook.webhookSecret)) {
            if(sig) console.log('node-facebooky/webhooks received "x-hub-signature" header but no secret defined');
            if(Facebook.webhookSecret) console.log('node-facebooky/webhooks verify_token defined but "x-hub-signature" header field not found');
          }

          else {
            when(body)
              .then(bodyObj => {
                processBody(bodyObj);
              })
              .catch(err => {
                console.log('node-facebooky/webhooks %s', err.message);
              });
          }
        }

        // else, invalid request
        else {
          // always respond OK if res is defined
          if(typeof res !== 'undefined') {
            res.status(200);
            res.send('OK');
          }

          console.log('node-facebooky/webhooks received invalid request');
        }
      }

      // else, invalid request
      else {
        // always respond OK if res is defined
        if(typeof res !== 'undefined') {
          res.status(200);
          res.send('OK');
        }

        console.log('node-facebooky/webhooks received invalid request');
      }
    };

    return webhookHandler;
  };

  // return the Facebook Object
  return Facebook;
 };
