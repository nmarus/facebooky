'use strict';

const assert = require('assert');
const when = require('when');
const Facebook = require('../');
const validator = require('../validator');

let facebook = new Facebook();

describe('#Facebook.webhookAuth()', function() {
  it('calculates hmac-sha1 and verifies on test data.', function() {
    let secret = 'testSecret1234';
    let sig = 'sha1=e514a9a0d82760314204c2b9d9eff2fef2b51511';
    let payload = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean vitae sodales elit. Mauris eleifend odio lacus. Integer eu volutpat neque, id varius magna. Nullam ac ex blandit orci blandit varius. Maecenas sollicitudin, lacus ut pharetra cursus, lorem dui egestas massa, a pharetra massa velit sed enim. Sed maximus enim elit, eget tincidunt ante semper eget. Donec vitae tincidunt est. Ut tincidunt erat a tellus dignissim, sit amet egestas diam aliquet. Proin ante massa, vulputate id facilisis vel, faucibus ut diam. Integer nec enim laoreet, ultrices sapien vitae, suscipit urna. Suspendisse bibendum elit eros, et pellentesque nisl tincidunt sed. Proin at auctor magna. Vestibulum blandit, arcu in consectetur varius, neque neque suscipit velit, quis venenatis ipsum dolor non odio. Suspendisse potenti. Mauris volutpat lorem id lacus convallis scelerisque. Pellentesque efficitur ullamcorper metus, sed aliquam ex volutpat in.';

    return facebook.webhookAuth(secret, sig, payload)
      .then(function(payload) {
        return when(assert(payload, 'invalid response'));
      });
  });
});
