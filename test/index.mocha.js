/**
 * @license MIT
 * @copyright 2015 commenthol
 */

'use strict';

var assert = require('assert');
var seq = require('../index.js').seq;
var series = require('../index.js').series;

/* globals describe, it */ ///< used for jshint

// test helper
function step(data, cb) {
	this.next(data, cb); // jshint ignore:line
}

step.next = function(data, cb) {
	process.nextTick(function(){
		cb(null, data + 1);
	});
};

step.neverReach = function(data, cb) {
	assert.ok(true, 'Should not reach here');
	this.next(data, cb);
};

describe('#series', function(){

	it('can process async function in series ', function(done){
		var data = 0

		function _step(cb) {
			step.next(data++, cb);
		}

		series([
			_step,
			_step,
			_step,
			_step,
			_step
		], function(err, data){
			assert.ok(!err, ''+err);
			assert.deepEqual(data, [ 1, 2, 3, 4, 5 ]);
			done();
		});
	});

	it('can process async function in series using an object', function(done){
		var data = 0

		function _step(cb) {
			step.next(data++, cb);
		}

		series({
			one: _step,
			two: _step,
			three: _step,
			four: _step,
			five: _step
		}, function(err, data){
			assert.ok(!err, ''+err);
			assert.deepEqual(data, { one: 1, two: 2, three: 3, four: 4, five: 5 });
			done();
		});
	});

	it('can exit on error', function(done){
		var data = 0

		function _step(cb) {
			step.next(data++, cb);
		}
		_step.err = function(cb) {
			cb('err');
		}

		series([
			_step,
			_step,
			_step.err,
			_step,
			_step
		], function(err, data){
			assert.ok(err, ''+err);
			assert.deepEqual(data, [ 1, 2, undefined ]);
			done();
		});
	});

	it('can process async function in series with pre-exit', function(done){
		var data = 0

		function _step(cb) {
			step.next(data++, function(err, data){
				cb(err, data, (data >= 3));
			});
		}

		series([
			_step,
			_step,
			_step,
			_step,
			_step
		], function(err, data){
			assert.ok(!err, ''+err);
			assert.deepEqual(data, [ 1, 2, 3 ]);
			done();
		});
	});

});

describe('#seq', function(){

	it('can stack async functions while passing on the results', function(done){
		seq(
			step.next,
			step,
			step,
			step,
			step
		)(0, function(err, data){
			assert.ok(!err, ''+err);
			assert.equal(data, 5);
			done();
		});
	});

	it('can stack async functions using an Array', function(done){
		seq([
			step,
			step,
			step,
			step,
			step
		])(0, function(err, data){
			assert.ok(!err, ''+err);
			assert.equal(data, 5);
			done();
		});
	});

	it('can stack async functions using an object', function(done){
		seq({
			one: step,
			two: step,
			three: step,
			four: step,
			five: step
		})(0, function(err, data){
			assert.ok(!err, ''+err);
			assert.equal(data, 5);
			done();
		});
	});

	it('can trap on errors', function(done){
		seq(
			step,
			step,
			function(data, cb){
				// cause error
				cb('err', data + 10);
			},
			step.neverReach,
			step.neverReach,
			function(err, data, cb) {
				// traps error
				cb(err, data + 10);
			},
			step.neverReach,
			step.neverReach
		)(0, function(err, data){
			assert.equal(err, 'err');
			assert.equal(data, 22);
			done();
		});
	});

	it('can trap on errors and continue', function(done){
		seq(
			step,
			step,
			function(data, cb){
				// cause error
				cb('err', data + 10);
			},
			function(err, data, cb) {
				// traps error
				cb(null, data + 10);
			},
			step,
			step
		)(0, function(err, data){
			assert.ok(!err, ''+err);
			assert.equal(data, 24);
			done();
		});
	});

	it('can pass over error traps', function(done){
		seq(
			step,
			step,
			function(err, data, cb) {
				// should traps error - but is never called
				assert.ok(true, 'Should not reach here');
				cb(null, data + 10);
			},
			step,
			step
		)(0, function(err, data){
			assert.ok(!err, ''+err);
			assert.equal(data, 4);
			done();
		});
	});

	it('can pre-exit', function(done){
		seq(
			step,
			step,
			function(data, cb) {
				cb(null, data, true);
			},
			step.neverReach,
			step.neverReach
		)(0, function(err, data){
			assert.ok(!err, ''+err);
			assert.equal(data, 2);
			done();
		});
	});

});

