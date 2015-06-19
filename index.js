/**
 * @license MIT
 * @copyright 2015 commenthol@gmail.com
 */

/* globals define */

;(function(ctx){
	'use strict';

	var
		M = {}, // define the module
		moduleName = 'asynccond'; // the name of the module

	var _isArray = Array.isArray || function (obj) {
		return _toString.call(obj) === '[object Array]';
	};

	function noop (){};

	function _toArray(obj) {
		var res = {
			keys: [],
			vals: []
		};
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				res.keys.push(key);
				res.vals.push(obj[key]);
			}
		}
		return res;
	}

	function _toResults(results, keys) {
		var i,
			tmp = {};
		if (keys) {
			for (i=0; i<results.length; i++) {
				tmp[keys[i]] = results[i];
			}
			return tmp;
		}
		else {
			return results;
		}
	}

	/**
	 * Applies the function `iterator` to each item in `arr` in series.
	 * The `iterator` is called with an item from `arr`, and a callback
	 * when it has finished. If the `iterator` passes an error to its
	 * callback, the main `callback` is immediately called with the error.
	 *
	 * If a condition is applied on the internal callback of `iterator`,
	 * it pre-exits the series.
	 *
	 * #### Example
	 *
	 * ````js
	 * eachSeries(
	 *   [ 1, 2, 3, 4, 5 ],
	 *   // iterator
	 *   function (data, cb) {
	 *     cb(null, data * 2, (data * 2 > 5)); // exits if condition is met
	 *   },
	 *   // callback
	 *   function(err, data){
	 *     //> data = [ 2, 4, 6 ]);
	 *   }
	 * );
	 * ````
	 *
	 *
	 * @param {Array} arr - array of items which are passed to `iterator`
	 * @param {Function} iterator - `function(item, cb)` `cb` needs to be called inside `iterator`
	 * @param {Function} [callback] - is of type `function(err, result)` and called after running the series
	 */
	function eachSeries(arr, iterator, callback) {
		var i = 0,
			results = [];

		callback = callback || noop;

		function cb(err, res, exit){
			results.push(res);
			if (err || exit) {
				return callback(err, results);
			}
			else {
				run();
			}
		}

		function run() {
			var a = arr[i++];
			if (a) {
				iterator(a, cb);
			}
			else {
				return callback(null, results);
			}
		}

		run();
	}
	M.eachSeries = eachSeries;

	/**
	 * Run the functions in the `tasks` array in series, each one running
	 * once the previous function has completed. If any functions in the
	 * series pass an error to its callback, no more functions are run,
	 * and `callback` is immediately called with the value of the error.
	 * Otherwise, `callback` receives an array of results when `tasks`
	 * have completed.
	 *
	 * It is also possible to pass an object instead of an array for
	 * `tasks`. Each property will be run as a function, and the results
	 * will be passed to the final callback as an object instead of an
	 * array. This can be a more readable way of handling results from
	 * series.
	 *
	 * The series can be exited immediately on any internal callback.
	 *
	 * #### Example
	 *
	 * ````js
	 * var series = require('asynccond').series;
	 * var data = 7;
	 *
	 * series({
	 *   one: function(cb) {
	 *     cb(null, data+=10);
	 *   },
	 *   two: function(cb) {
	 *     cb(null, data+=10, (data>25)); // conditional exit
	 *   },
	 *   three: function(cb) {
	 *     cb(null, data+=10);
	 *   }
	 * },function(err, result) {
	 *   //> result = { one: 17, two: 27 }
	 * })
	 * ````
	 *
	 *
	 * @param {Array|Object} tasks - the async functions to run in series
	 * @param {Function} [callback] - is of type `function(err, result)` and called after running the series
	 */
	function series(tasks, callback) {
		var i = 0,
			keys,
			results = [];

		callback = callback || noop;

		if (!_isArray(tasks) &&  typeof(tasks) === 'object') {
			keys = _toArray(tasks);
			tasks = keys.vals;
			keys = keys.keys;
		}

		function cb(err, res, exit){
			results.push(res);
			if (err || exit) {
				return callback(err, _toResults(results, keys));
			} else {
				run();
			}
		}

		function run() {
			var fn = tasks[i++];
			if (fn) {
				fn(cb);
			}
			else {
				return callback(null, _toResults(results, keys));
			}
		}

		run();
	}
	M.series = series;

	/**
	 * Creates a function which is a composition of the passed
	 * asynchronous functions. Each function consumes the return value
	 * of the function that follows.
	 *
	 * Each function is executed with the this binding of the composed
	 * function.
	 *
	 * #### Example
	 *
	 * ````js
	 * var seq = require('asynccond').seq;
	 * var start = 1;
	 *
	 * seq(
	 *   function(data, cb) {
	 *     cb(null, data+1);
	 *   },
	 *   function(data, cb) {
	 *     cb('err', data+1); // causes an error --> will execute the next function with arity = 3
	 *   },
	 *   function(data, cb) {
	 *     cb(null, data+1);  // jumps over here (remind the previous error)
	 *   },
	 *   function(err, data, cb) { // the error trap (arity = 3) is only called if there is an error
	 *     cb(null, data+10);
	 *   },
	 *   function(data, cb) {
	 *     cb(null, data+1, (data > 10)); // exits list immediately if data>10
	 *   },
	 *   function(data, cb) {
	 *     cb(null, data+1); // never reaches in this case
	 *   }
	 * )(
	 *   start,
	 *   function(err, result) {
	 *     // the final callback function
	 *     //> err    = null
	 *     //> result = 14
	 *   }
	 * );
	 * ````
	 *
	 *
	 * @param {Array|Object|Function} tasks - Array or Object or Arguments list of functions `function(data, callback)` where `callback` is of type `function(err, result, [exit])`
	 * @return {Function} call with `(data, callback)` where `callback` is of type `function(err, result)`
	 */
	function seq() {

		var callback;
		var i = 0;
		var tasks = [].slice.call(arguments);

		if (tasks.length === 1) {
			if (_isArray(tasks[0])) {
				tasks = tasks[0];
			}
			else if (typeof tasks[0] === 'object') {
				tasks = _toArray(tasks[0]).vals;
			}
		}

		function run(err, data, exit) {
			var arity,
				fn = tasks[i++];

			if (!fn || exit) {
				return callback(err, data); // exit
			}

			fn = fn.bind(fn);
			arity = fn.length;

			if (err) {
				if (arity === 3) {
					fn(err, data, run);
				}
				else  {
					run(err, data);
				}
			}
			else if (arity <= 2) {
				fn(data, run);
			}
			else {
				run(err, data);
			}
		}

		return function(data, _callback) {
			callback = _callback || noop;
			i = 0;
			run(null, data);
		};
	}
	M.seq = seq;

	// Node.js
	if (typeof ctx.Window === 'undefined' && typeof module !== 'undefined' && module.exports) {
		module.exports = M;
	}
	// AMD / RequireJS
	else if (typeof define !== 'undefined' && define.amd) {
		define([], function () {
			return M;
		});
	}
	// included in browser via <script> tag
	else if (typeof ctx.Window !== 'undefined' && !ctx[moduleName]) {
		ctx[moduleName] = M;
	}

})(this);
