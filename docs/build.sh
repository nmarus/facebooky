#!/bin/bash

JSDOC="$(pwd)/../node_modules/jsdoc-to-markdown/bin/cli.js"
README="$(pwd)/../README.md"

cat header.md > ${README}

${JSDOC} ../lib/facebook.js \
  ../lib/res/messages.js \
  ../lib/res/people.js \
  ../lib/res/webhooks.js \
  ../lib/validator.js >> ${README}

cat license.md >> ${README}
