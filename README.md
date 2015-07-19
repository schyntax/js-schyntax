# schyntax

[![npm version](https://badge.fury.io/js/schyntax.svg)](http://badge.fury.io/js/schyntax)
[![Build Status](https://travis-ci.org/schyntax/js-schyntax.svg?branch=master)](https://travis-ci.org/schyntax/js-schyntax)

A simple Node.js utility for parsing [Schyntax](https://github.com/schyntax/schyntax) schedule strings, and finding the next scheduled event time.

Schyntax ___is not___ a scheduled task runner. It simply helps you determine _when_ a task should run. If you're looking for a task runner built on Schyntax, try [Schtick](https://github.com/schyntax/js-schtick).

## Install

```
npm install schyntax
```

## Examples

Find the next weekday (Monday through Friday) at 16:00 UTC:

```javascript
var schyntax = require('schyntax');

var schedule = schyntax('hours(16), days(mon..fri)');
console.log(schedule.next());
```

Find noon on the next day which isn't the Fourth of July or December 25th:

```javascript
var schedule = schyntax('hours(12), dates(!12/25, !7/4)');
console.log(schedule.next());
```

Find the next seven dates which are either 10AM on a weekday, or noon on a weekend by using schedule groups (expressions grouped inside curly braces):

```javascript
var schedule = schyntax('{hours(10), days(!sat..sun)} {hours(12), days(sat..sun)}');
var dates = [];
var d = null;
for (var i = 0; i < 7; i++) {
  d = schedule.next(d);
  dates.push(d);
}
console.log(dates);
```

## Methods

<a name="schyntax-next"></a>
### schyntax#next

Accepts an optional `after` argument in the form of a `Date` object or numeric Unix timestamp in milliseconds. If no argument is provided, the current time is used.

Returns a `Date` object representing the next timestamp which matches the scheduling criteria. The date will always be greater than, never equal to, `after`. If no timestamp could be found which matches the scheduling criteria, a `ValidTimeNotFoundError` error is thrown, which generally indicates conflicting scheduling criteria (explicitly including and excluding the same day or time).

<a name="schyntax-previous"></a>
### schyntax#previous

Same as `schyntax#next` accept that its return value will be less than or equal to the current time or optional `atOrBefore` argument. This means that if you want to find the last n-previous events, you should subtract at least a millisecond from the result before passing it back to the function. For example, here is the reverse of one of the prior examples:

```javascript
var schedule = schyntax('{ hours(10), days(!sat..sun) } { hours(12), days(sat..sun) }');
var dates = [];
var d = null;
for (var i = 0; i < 7; i++) {
  d = schedule.previous(d ? d - 1 : null);
  dates.push(d);
}
console.log(dates);
```

## Syntax

For complete documentation on the Schyntax domain-specific language, see the [Schyntax project](https://github.com/schyntax/schyntax).
