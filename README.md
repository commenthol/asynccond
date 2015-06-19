# asynccond

> async series with conditional exit

[![NPM version](https://badge.fury.io/js/asynccond.svg)](https://www.npmjs.com/package/asynccond/)
[![Build Status](https://secure.travis-ci.org/commenthol/asynccond.svg?branch=master)](https://travis-ci.org/commenthol/asynccond)

Async series functions with the ability to conditionally pre-exit the sequence.

`seq` furthermore allows to trap errors within the sequence.

The functions provided are backwards compatible with [async][].


## Table of Contents

<!-- !toc (minlevel=2 omit="Table of Contents") -->

* [Description](#description)
  * [eachSeries(arr, iterator, callback)](#eachseriesarr-iterator-callback)
  * [series(tasks, callback)](#seriestasks-callback)
  * [seq(tasks)](#seqtasks)
* [Contribution and License Agreement](#contribution-and-license-agreement)
* [License](#license)
* [References](#references)

<!-- toc! -->

## Description

### eachSeries(arr, iterator, callback)

Applies the function `iterator` to each item in `arr` in series.
The `iterator` is called with an item from `arr`, and a callback
when it has finished. If the `iterator` passes an error to its
callback, the main `callback` is immediately called with the error.

If a `true` condition is applied as third argument on the internal
callback of `iterator`, it immediately pre-exits the series.

#### Example

````js
eachSeries(
  [ 1, 2, 3, 4, 5 ],
  // iterator
  function (data, cb) {
    cb(null, data * 2, (data*2 >5)); // exits if condition is met
  },
  // callback
  function(err, data){
    //> data = [ 2, 4, 6 ]
  }
);
````

**Parameters**

**arr**: `Array`, array of items which are passed to `iterator`

**iterator**: `function`, `function(item, cb)` `cb` needs to be called inside `iterator`

**callback**: `function`, is of type `function(err, result)` and called after running the series



### series(tasks, callback)

Run the functions in the `tasks` array in series, each one running
once the previous function has completed. If any functions in the
series pass an error to its callback, no more functions are run,
and `callback` is immediately called with the value of the error.
Otherwise, `callback` receives an array of results when `tasks`
have completed.

It is also possible to pass an object instead of an array for
`tasks`. Each property will be run as a function, and the results
will be passed to the final callback as an object instead of an
array. This can be a more readable way of handling results from
series.

If a `true` condition is applied as third argument on the internal
callback of `iterator`, it immediately pre-exits the series.

#### Example

````js
var series = require('asynccond').series;
var data = 7;

series({
  one: function(cb) {
    cb(null, data+=10);
  },
  two: function(cb) {
    cb(null, data+=10, (data>25)); // conditional exit
  },
  three: function(cb) {
    cb(null, data+=10);
  }
},function(err, result) {
  //> result = { one: 17, two: 27 }
})
````

**Parameters**

**tasks**: `Array | Object`, the async functions to run in series

**callback**: `function`, is of type `function(err, result)` and called after running the series



### seq(tasks)

Creates a function which is a composition of the passed
asynchronous functions. Each function consumes the return value
of the function that follows.

Each function is executed with the this binding of the composed
function.

If a `true` condition is applied as third argument on the internal
callback of an async function, it immediately pre-exits the series.

#### Example

````js
var seq = require('asynccond').seq;
var start = 1;

seq(
  function(data, cb) {
    cb(null, data+1);
  },
  function(data, cb) {
    cb('err', data+1); // causes an error -->
                       // will execute the next function with arity = 3
  },
  function(data, cb) {
    cb(null, data+1);  // jumps over here (remind the previous error)
  },
  function(err, data, cb) { // the error trap (arity = 3)
    cb(null, data+10);      // is only called if there is an error
  },
  function(data, cb) {
    cb(null, data+1, (data > 10)); // exits list immediately if data>10
  },
  function(data, cb) {
    cb(null, data+1); // never reaches in this case
  }
)(
  start,
  function(err, result) {
    // the final callback function
    //> err    = null
    //> result = 14
  }
);
````

**Parameters**

**tasks**: `Array | Object | function`, Array or Object or Arguments list of functions `function(data, callback)` where `callback` is of type `function(err, result, [exit])`

**Returns**: `function`, call with `(data, callback)` where `callback` is of type `function(err, result)`


## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your
code to be distributed under the MIT license. You are also implicitly
verifying that all code is your original work or correctly attributed
with the source of its origin and licence.

## License

Copyright (c) 2015 commenthol (MIT License)

See [LICENSE][] for more info.

## References

<!-- !ref -->

* [async][async]
* [LICENSE][LICENSE]

<!-- ref! -->

[LICENSE]: ./LICENSE
[async]: https://github.com/caolan/async



