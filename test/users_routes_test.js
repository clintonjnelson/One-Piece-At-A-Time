'use strict';

var chai     = require('chai');
var chaihttp = require('chai-http');
var expect   = chai.expect;
var mongoose = require('mongoose');
var User     = require('../models/User.js');
var colors = require("colors");
chai.use(chaihttp);

// Use test db
process.env.MONGOLAB_URI = 'mongodb://localhost/skribbl_test';

// Start api server for testing
require('../server.js');


describe('Users', function() {
  before(function(done) {   // Make a new, regular user in db
    chai.request('localhost:3000')
      .post('/api/users/')
      .send({username: 'unicorn', email: 'unicorn@example.com', password: 'foobar'})
      .end(function(err, res) {
        expect(err).to.eq(null);
        User.findOne({username: 'unicorn'}, function(err, user) { // verify added
          expect(err).to.eq(null);
          done();
        });
      });
  });

  after(function(done) {
    mongoose.connection.db.dropDatabase(function(){ done(); });
  });

  describe('POST /api/users', function() {
    describe('WITHOUT existing user', function() {
      describe('with VALID inputs', function() {
        it('returns a success message',  function(done) {
          chai.request("localhost:3000")
            .post("/api/users")
            .send({username: "firstEntry", email: "initial@gmail.com", password: "foobar1"})
            .end(function(err, res) {
              expect(err).to.eql(null);
              expect(res.body.success).to.eql(true);
              expect(res.body.usernamePass).to.eql(true);
              expect(res.body.emailPass).to.eql(true);
              done();
            });
        });
      });
    });

    // existing user from above post request
    // should probably use a before block
    describe("WITH an existing user", function() {
      describe("with INVALID input", function() {
        it.skip("returns a fail JSON object due to duplicate username", function(done) {
          chai.request("localhost:3000")
            .post("/api/users")
             .send({username: 'unicorn', email: 'unicorns@example.com', password: 'foobar'})
             .end(function(err, res) {
              expect(err).to.eql(null);
              expect(res.body.success).to.eql(false);
              expect(res.body.usernamePass).to.eql(false);
              done();
            });
        });

        it.skip("returns fail a JSON object due to duplicate email", function(done) {
          chai.request("localhost:3000")
            .post("/api/users")
             .send({username: 'unicorns', email: 'unicorn@example.com', password: 'foobar'})
             .end(function(err, res) {
              expect(err).to.eql(null);
              expect(res.body.success).to.eql(false);
              expect(res.body.emailPass).to.eql(false);
              done();
            });
        });
      });
    });
  });

  describe("DELETE /api/users/:username", function() {
      describe("WITHOUT admin privileges", function() {
        var theToken = {}; // has to be an object
          before(function(done) {
            chai.request('localhost:3000')  // make call to login user
              .get('/api/login')
              .auth('unicorn@example.com', 'foobar')
              .end(function(err, res) {
                expect(err).to.eq(null);
                theToken.eat = res.body.eat;
                done();
              });
          });

        it("prevents user from suspending another user", function(done) {
          chai.request("localhost:3000")
            .del("/api/users/unicorn")
            .send(theToken)
            .end(function(err, res) {
              expect(err).to.eql(null);
              expect(res.body.msg).to.eql("Unauthorized.");
              done();
            });
        });
      });

    describe("WITH admin privileges", function(done) {
       before(function(done) {   // Make a new, regular user in db
          chai.request('localhost:3000')
            .post('/api/users/')
            .send({username: 'rainbow', email: 'rainbow@example.com', role: "admin", password: 'foobar123'})
            .end(function(err, res) {
              expect(err).to.eq(null);
              User.findOne({username: 'rainbow'}, function(err, user) { // verify added
                expect(err).to.eq(null);
                done();
              });
            });
        });

        var theToken = {}; // has to be an object
          before(function(done) {
            chai.request('localhost:3000')  // make call to login user
              .get('/api/login')
              .auth('rainbow@example.com', 'foobar123')
              .end(function(err, res) {
                expect(err).to.eq(null);
                theToken.eat = res.body.eat;
                done();
              });
          });

          it("allows admin to suspend user", function(done) {
             chai.request("localhost:3000")
            .del("/api/users/unicorn")
            .send(theToken)
            .end(function(err, res) {
              expect(err).to.eql(null);
              expect(res.body.msg).to.eql("success");
              done();
            });
          });
      });
    });
});
