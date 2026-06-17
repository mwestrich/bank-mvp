const serverless = require('serverless-http');
const app = require('../backend/app');

// Wrap the Express app for Serverless Deployment
module.exports = serverless(app);
