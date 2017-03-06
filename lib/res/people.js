'use strict';

const when = require('when');

const validator = require('../validator');

/**
 * Person Object
 *
 * @namespace Person
 * @property {String} id - Person ID
 * @property {String} displayName - Display name
 * @property {String} firstName - First name
 * @property {String} lastName  - Last name
 * @property {String} avatar - Avatar URL
 */

module.exports = function(Facebook) {

  /**
   * Returns a Facebook Person Object specified by Profile/Person ID.
   *
   * @function
   * @param {String} personId - Facebook Profile/Person ID
   * @returns {Promise.<Person>} Person
   *
   * @example
   * facebook.personGet('1234567890')
   *   .then(function(person) {
   *     console.log(person.firstName);
   *   })
   *   .catch(function(err) {
   *     // process error
   *     console.log(err);
   *   });
   */
  Facebook.personGet = function(personId) {
    return Facebook.request('get', null, personId, { fields: 'first_name,last_name,profile_pic,locale,timezone,gender' })
      .then(res => {
        return when({
          id: personId,
          displayName: res.first_name + ' ' + res.last_name,
          firstName: res.first_name,
          lastName: res.last_name,
          avatar: res.profile_pic
        });
      });
  };

  // return the Facebook Object
  return Facebook;
};
