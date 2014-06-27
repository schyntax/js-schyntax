# sch

[![Build Status](https://travis-ci.org/bretcope/sch.svg?branch=master)](https://travis-ci.org/bretcope/sch)

A simple Node.js utility for parsing schedule strings, and finding the next scheduled event time.

Sch ___is not___ a scheduled task runner. It simply helps you determine _when_ a task should run.

## Examples

Find the next weekday (Monday-Friday) at 16:00 UTC:

```javascript
var sch = require('sch');

var schedule = sch('hours(16), days(mon-fri)');
console.log(schedule.next());
```

Find noon on the next day which isn't the Fourth of July or December 25th:

```javascript
var schedule = sch('hours(12), dates(!12/25, !7/4)');
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

<a name="sch-next"></a>
### sch#next

Accepts an optional `after` argument in the form of a `Date` object or numeric Unix timestamp in milliseconds. If no argument is provided, the current time is used.

Returns a `Date` object representing the next timestamp which matches the scheduling criteria. The date will always be greater than, never equal to, `after`. If no timestamp could be found which matches the scheduling criteria, `null` is returned, which generally indicates conflicting scheduling criteria (explicitly including and excluding the same day or time).

<a name="sch-previous"></a>
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

## Syntax

Format strings are composed of expressions. Each . The `sch(format)` method will throw an exception if the format string is invalid.

Syntax rules:

* Expression uses a similar syntax as function calls in C-Style languages: `name(arg0, arg1, arg2)`
* Format strings are case-insensitive. `dayofmonth` is equivalent to `DAYOFMONTH` or `dayOfMonth`, etc.
* All whitespace is insignificant.
* Fractional numbers should not be used. Any fractional portion of a number will be truncated into an integer.
* An argument preceded by a `!` is treated as an exclude. `days(!sat-sun)` means that Saturday and Sunday are excluded from the schedule.
* All expressions accept any number of arguments, and may mix includes and excludes. For example, you might specify every weekday except tuesday as `days(mon-fri, !tues)`.
* All time-related values are evaluated as UTC. `hours(12)` will be noon UTC, not noon local.
* Numeric ranges are specified in the form of `low-high`. For example, `days(1-5)` equals the first five days of the month. The order of high and low is significant, and an exception will be thrown if low is greater than high (except as noted in the expression documentation).

## Expressions

Expressions allow you to define when you want events to occur, and when you explicitly do not want them to occur. If your format string does not contain any expressions, it will be invalid and sch will throw an exception.

### minutes

Aliases: `m`, `min`, `minute`, `minuteofhour`, `minutesOfHour`

Accepts numbers and numeric-range arguments between 0 and 59 inclusive.

### hours

Aliases: `h`, `hour`, `hourOfDay`, `hoursOfDay`

Accepts numbers and numeric-range arguments between 0 and 59 inclusive.

### daysOfWeek

Aliases: `w`, `day`, `days`, `dayOfWeek`, `dow`

Accepts numbers and numeric-range arguments between 1 (Sunday) and 7 (Saturday) inclusive. Additionally, you may use textual versions of the dates. Two or three-character abbreviations are accepted (`mo-th` or `mon-thu`) as well as full names (`monday-thursday`). Because `tues`, `thur`, and `thurs` are common abbreviations, those special cases are also accepted, but it may be better to stick to the more predictable 2-3 characters.

Days of week ranges are allowed to span across week boundaries. `6-2` or `fri-mon` are valid ranges and are interpreted as (Friday, Saturday, Sunday, Monday).

### daysOfMonth

Aliases: `dom`, `dayOfMonth`

Accepts numbers and numeric-range arguments between 1 and 31 inclusive. A second range from -31 to -1 is also allowed and are counted as days from the end of the month.

Examples:

* `dom(-1)` The last day of the month.
* `dom(-5--1)` the last five days of the month.
* `dom(10--1)` The 10th through the last day of the month.

### dates

Aliases: `date`

Allows you to include or exclude specific dates or date ranges. Date arguments take the form of `m/d`. Date ranges are `m/d-m/d` and are allowed to span across January 1st.

Examples:

* `dates(!12/25, !7/4)` Run every day except December 25th and July 4th.
* `dates(4/1)` Only run on April 1st.
* `dates(4/1 - 4/30)` Only run for the month of April.
* `dates(4/1 - 4/30, !4/16)` Run every day in April except for April 16th.
* `dates(!12/25 - 1/1)` Run every day except December 25th through January 1st.

## Defaults

When you don't include all expressions, some assumptions have to be made about what you intended. Here are the scenarios:

* If both __hours__ and __minutes__ are not specified, they default to `hours(0) minutes(0)`.
* If __minutes__ is specified, but __hours__ is not, it defaults to `hours(0-23)`.
* If __hours__ is specified, but __minutes__ is not, it defaults to `minutes(0)`.
* If no date expressions are specified (__daysOfWeek__, __daysOfMonth__, __dates__), the default is `daysOfWeek(sun-sat)`.

Here are some examples which illustrate these defaults:

* `minutes(10)` will run at ten minutes after every hour of every day.
* `hours(12)` will run at noon UTC everyday.
* `daysOfWeek(mon-fri)` will run at midnight UTC Mondays through Fridays.
* `daysOfWeek(mon) hours(12)` will run at noon UTC on Mondays.
* `daysOfWeek(mon) minutes(0, 30)` will run at the top and half of every hour on Mondays.

## Groups

Expressions can be grouped using the `group(expression, expression, ... )` syntax. This allows you to setup rules which are evaluated independently from each other. For example, you may want to have a different set of rules for weekdays vs. weekends.

Examples:

* `group(hours(10), days(!sat-sun)) group(hours(12), days(sat-sun))` 10AM on weekdays, and noon on weekends.
* `group(dates(10/1 - 3/31) hours(12)) group(dates(4/1 - 9/30) hours(14))` 12:00 October through March. 14:00 April through September.

When [sch#next](#sch-next) or [sch#previous](#sch-previous) is called, all groups are evaluated to find the next or previous applicable date, and return which ever date which is closest.  All expressions not inside a `group()` are collected and implicitly put into a group.

Nesting of groups is not allowed.

> Note that, unlike the argument list inside expressions, the commas in the group syntax are optional. `group(exp exp exp ... )` is also valid.

## Contributing

Bug fixes are always welcome. If you would like to contribute features to the sch expression language, open an issue with your proposed functionality, syntax changes, and use cases _BEFORE_ you submit a pull request so that it can be discussed.
