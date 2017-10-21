const express = require('express')
const session = require('express-session')
const request = require('request')
const settings = require('./settings.json')
const file = require('./coding-test-qlab-contract.json')
const app = express()

const makeRequest = function (opts, cb) {
  request(opts, function (error, response, body) {
      if (error) {
          cb(error);
      }
      if (!error && response.statusCode == 200) {
          cb(body);
      }
  })
}

const getNewToken = function (req, res, cb) {
    const options = {
        url: settings.TOKEN_URL,
        method: 'POST',
        form: {'grant_type':settings.GRANT_TYPE, 'client_id': settings.CLIENT_ID, 'client_secret': settings.CLIENT_SECRET}
    }
    makeRequest(options, cb);
}

const getStatData = function (req, res, cb) {
    const options = {
        url: settings.RISK_URL,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + req.session.auth.token 
        },
        json: file
    }
    makeRequest(options, cb);
}

const authenticate = function (req, res, next) {
  if (req.session && req.session.auth) {
    next();
  } else {
    getNewToken(req, res, function (body) {
      const token = JSON.parse(body).access_token;
      req.session.auth = {
        expires: Date.now() + 7200,
        token: token 
      };
      res.redirect(req.path);
    });
  }
}

app.use(session({
  secret: 'test-work',
  resave: false,
  saveUninitialized: true,
  cookie: {}
}));

app.get('/api/v1.0/risk', authenticate, function (req, res) {
  getStatData(req, res, function (data) {
    res.send(data);
  });
})

app.listen(settings.PORT, function () {
  console.log('listening on port ' +  settings.PORT)
})