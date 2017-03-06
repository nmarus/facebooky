'use strict';

const when = require('when');

const validator = require('../validator');

/**
 * Message Object
 *
 * @namespace Message
 * @property {String} id - Message ID
 * @property {String} text - Message text
 * @property {String} personId - Person ID
 * @property {String} created - Date Message created (ISO 8601)
 */

module.exports = function(Facebook) {

  /**
   * Send Facebook Message.
   *
   * @function
   * @param {Object.<MessageAdd>} message - Facebook Message Add Object
   * @returns {Promise.<Message>} Message
   *
   * @example
   * let newMessage = {
   *   personId: '1234567890',
   *   text: 'Hello World'
   * };
   *
   * facebook.messageSend(newMessage)
   *   .then(function(message) {
   *     console.log(message.id);
   *   })
   *   .catch(function(err) {
   *     // process error
   *     console.log(err);
   *   });
   */
  Facebook.messageSend = function(message) {
    return Facebook.request('post', 'me/messages', {
      recipient: {
        id: message.personId
      },
      message: {
        text: message.text
      }
    })
    .then(res => {
      return when({
        id: res.message_id,
        text: message.text,
        personId: personId,
        created: moment().format()
      });
    });
  };

  // return the Facebook Object
  return Facebook;
};
