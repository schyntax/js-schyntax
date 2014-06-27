# sch

A simple Node.js utility for parsing schedule strings, and finding the next scheduled event time.

## Examples

Find the next weekday (Monday-Friday) at 16:00 UTC:

```javascript
var sch = require('sch');

var schedule = sch('hours(16), days(mon-fri)');
console.log(schedule.next());
```

Find noon on the next day which isn't the Fourth of July or December 25th:

```javascript
var schedule = sch('hours(12), dates(!12-25, !7-4)');
console.log(schedule.next());
```

Find the next seven dates which are either 10AM on a weekday, or noon or a weekend by using schedule groups:

```javascript
var schedule = sch('group(hours(10), days(!sat-sun)) group(hours(12), days(sat-sun))');
var dates = [];
var d = null;
for (var i = 0; i < 7; i++) {
  d = schedule.next(d);
  dates.push(d);
}
console.log(dates);
```

## Methods

### sch#next

Accepts an optional `after` argument in the form of a `Date` object or numeric Unix timestamp in milliseconds. If no argument is provided, the current time is used.

Returns a `Date` object representing the next timestamp which matches the scheduling criteria. The date will always be greater than, never equal to, `after`. If no timestamp could be found which matches the scheduling criteria, `null` is returned, which generally indicates conflicting scheduling criteria (explicitly including and excluding the same day or time).

### sch#previous

Same as `sch#next` accept that its return value will be less than or equal to the current time or optional `atOrBefore` argument. This means that if you want to find the last n-previous events, you should subtract at least a millisecond from the result before passing it back to the function. For example, here is the reverse of one of the prior examples:

```javascript
var schedule = sch('group(hours(10), days(!sat-sun)) group(hours(12), days(sat-sun))');
var dates = [];
var d = null;
for (var i = 0; i < 7; i++) {
  d = schedule.previous(d ? d - 1 : null);
  dates.push(d);
}
console.log(dates);
```

## Format

... more documentation shortly ...