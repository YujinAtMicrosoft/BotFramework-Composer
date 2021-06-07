// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

var OIDCStrategy = require('passport-azure-ad').BearerStrategy;
var config = require('./config');
var cookieParser = require('cookie-parser');

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

module.exports = {
  initialize: (composer) => {
    console.log('Register azure auth plugin');
    var options = {
      identityMetadata: config.creds.identityMetadata,
      clientID: config.creds.clientID,
      responseType: config.creds.responseType,
      responseMode: config.creds.responseMode,
      redirectUrl: config.creds.redirectUrl,
      allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
      clientSecret: config.creds.clientSecret,
      validateIssuer: config.creds.validateIssuer,
      isB2C: config.creds.isB2C,
      issuer: config.creds.issuer,
      passReqToCallback: config.creds.passReqToCallback,
      scope: config.creds.scope,
      loggingLevel: config.creds.loggingLevel,
      nonceLifetime: config.creds.nonceLifetime,
      nonceMaxAmount: config.creds.nonceMaxAmount,
      useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
      cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
      clockSkew: config.creds.clockSkew,
    };

    composer.usePassportStrategy(
      new OIDCStrategy(options, function (iss, sub, profile, accessToken, refreshToken, done) {
        if (!profile.oid) {
          return done(new Error('No oid found'), null);
        }
        console.log(accessToken);
        // asynchronous verification, for effect...
        process.nextTick(function () {
          findByOid(profile.oid, function (err, user) {
            if (err) {
              return done(err);
            }
            if (!user) {
              // "Auto-registration"
              users.push(profile);
              return done(null, profile);
            }
            return done(null, user);
          });
        });
      })
    );

    composer.addWebMiddleware(cookieParser());

    composer.addWebRoute('get', '/login', (req, res) => {
      res.send('LOGIN REQUIRED! <a href="/auth/openid">LOGIN WITH azure HERE</a>');
    });

    composer.addWebRoute(
      'get',
      '/auth/openid',
      (req, res, next) => {
        composer.passport.authenticate('azuread-openidconnect', {
          response: res, // required
          resourceURL: config.resourceURL, // optional. Provide a value if you want to specify the resource.
          customState: 'my_state', // optional. Provide a value if you want to provide custom state value.
          failureRedirect: '/',
        })(req, res, next);
      },
      function (req, res) {
        console.log('Login was called in the Sample');
        res.redirect('/');
      }
    );

    composer.addWebRoute(
      'get',
      '/auth/openid/return',
      function (req, res, next) {
        composer.passport.authenticate('azuread-openidconnect', {
          response: res, // required
          failureRedirect: '/login',
        })(req, res, next);
      },
      function (req, res) {
        console.log('We received a return from AzureAD.');
        res.redirect('/home');
      }
    );

    composer.addWebRoute(
      'post',
      '/auth/openid/return',
      function (req, res, next) {
        composer.passport.authenticate('azuread-openidconnect', {
          response: res, // required
          failureRedirect: '/login',
        })(req, res, next);
      },
      function (req, res) {
        console.log('We received a return from AzureAD.');
        res.redirect('/home');
      }
    );

    composer.addAllowedUrl('/auth/openid');
    composer.addAllowedUrl('/auth/openid/return');

    composer.useUserSerializers(
      (user, done) => {
        console.log('SERIALIZE USER!');
        done(null, user.oid);
      },
      (oid, done) => {
        console.log('DESERIALIZE USER!', oid);
        findByOid(oid, function (err, user) {
          done(err, user);
        });
      }
    );
    var users = [];
    var findByOid = function (oid, fn) {
      for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        console.log('we are using user: ', user);
        if (user.oid === oid) {
          return fn(null, user);
        }
      }
      return fn(null, null);
    };
  },
};
