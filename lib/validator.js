'use strict';

/**
 * Facebook Object Validation
 *
 * @name Validator
 * @namespace Validator
 */
const Validator = {};

/**
 * Validate Options object
 *
 * @function
 * @memberof Validator
 * @param {Object.<Options>} options
 * @returns {Boolean} result
 */
Validator.isOptions = function(options) {
  return (typeof options === 'object'); // TODO
};

module.exports = Validator;
