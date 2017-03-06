# node-facebooky

#### Facebook API for Node JS (alpha-pre-release)

```js
"use strict";

const Facebook = require('./lib/facebook');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const facebook = new Facebook({
  token: '<token>',
  verify_token: '<verify token>',
  webhookSecret: '<webhook secret>'
});

// add event
facebook.on('messages', function(event, message, req) {
  if(event === 'created') {
    facebook.personGet(message.personId)
      .then(function(person) {
        console.log('%s said %s', person.displayName, message.text);
      })
      .catch(function(err) {
        console.log(err);
      });
  }
});

const app = express();
app.use(bodyParser.json());

// add route for path that is listening for web hooks
app.use('/webhook', facebook.webhookListen());

// start express server
const server = app.listen('3000', function() {
  console.log('Listening on port %s', '3000');
});
```

## Tests

Tests can be run via:

```bash
git clone https://github.com/nmarus/facebooky
cd facebooky
npm install
npm test
```

# Reference
