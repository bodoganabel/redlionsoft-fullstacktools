# AWS gyp fuckery

Error:
node_modules/.pnpm/@mapbox+node-pre-gyp@1.0.11/node_modules/@mapbox/node-pre-gyp/lib/node-pre-gyp.js:86:21: ERROR: No loader is configured for ".html" files: node_modules/.pnpm/@mapbox+node-pre-gyp@1.0.11/node_modules/@mapbox/node-pre-gyp/lib/util/nw-pre-gyp/index.html
node_modules/.pnpm/@mapbox+node-pre-gyp@1.0.11/node_modules/@mapbox/node-pre-gyp/lib/util/s3_setup.js:43:28: ERROR: Could not resolve "mock-aws-s3"
node_modules/.pnpm/@mapbox+node-pre-gyp@1.0.11/node_modules/@mapbox/node-pre-gyp/lib/util/s3_setup.js:76:22: ERROR: Could not resolve "aws-sdk"
node_modules/.pnpm/@mapbox+node-pre-gyp@1.0.11/node_modules/@mapbox/node-pre-gyp/lib/util/s3_setup.js:112:23: ERROR: Could not resolve "nock"

Short: App randomly starts complaining about AWS modules or some Gyp things, which you totally not use anyway...

Solution: 
Most probably you are using bcrypt or module that includes bcrypt in frontend (browser) environment, revert your changes and carefully add features back one by one, as this is almost impossible to trace where the piece of backend code is being added to frontend code 

