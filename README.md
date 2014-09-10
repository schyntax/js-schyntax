# schyntax

[![Build Status](https://travis-ci.org/schyntax/js-schyntax.svg?branch=master)](https://travis-ci.org/schyntax/js-schyntax)

A simple Node.js utility for parsing schedule strings, and finding the next scheduled event time.

Schyntax ___is not___ a scheduled task runner. It simply helps you determine _when_ a task should run. If you're looking for a task runner built on schyntax, try [Schtick](https://github.com/schyntax/js-schtick).

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

Find the next seven dates which are either 10AM on a weekday, or noon or a weekend by using schedule groups:

```javascript
var schedule = schyntax('group(hours(10), days(!sat..sun)) group(hours(12), days(sat..sun))');
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

Returns a `Date` object representing the next timestamp which matches the scheduling criteria. The date will always be greater than, never equal to, `after`. If no timestamp could be found which matches the scheduling criteria, `null` is returned, which generally indicates conflicting scheduling criteria (explicitly including and excluding the same day or time).

<a name="schyntax-previous"></a>
### schyntax#previous

Same as `schyntax#next` accept that its return value will be less than or equal to the current time or optional `atOrBefore` argument. This means that if you want to find the last n-previous events, you should subtract at least a millisecond from the result before passing it back to the function. For example, here is the reverse of one of the prior examples:

```javascript
var schedule = schyntax('group(hours(10), days(!sat..sun)) group(hours(12), days(sat..sun))');
var dates = [];
var d = null;
for (var i = 0; i < 7; i++) {
  d = schedule.previous(d ? d - 1 : null);
  dates.push(d);
}
console.log(dates);
```

## Syntax

Format strings are composed of [groups](#groups) of [expressions](#expressions). The `schyntax(format)` method will throw an exception if the format string is invalid.

General Syntax Rules:

* Expression uses a similar syntax as function calls in C-Style languages: `name(arg0, arg1, arg2)`
* Format strings are case-insensitive. `dayofmonth` is equivalent to `DAYOFMONTH` or `dayOfMonth`, etc.
* All whitespace is insignificant.
* Fractional numbers should not be used. Any fractional portion of a number will be truncated into an integer. Minute is currently the highest precision offered.
* An argument preceded by a `!` is treated as an exclude. `days(!sat..sun)` means that Saturday and Sunday are excluded from the schedule.
* All expressions accept any number of arguments, and may mix includes and excludes. For example, you might specify every weekday except tuesday as `days(mon..fri, !tues)`.
* All time-related values are evaluated as UTC. `hours(12)` will be noon UTC, not noon local.
* Numeric ranges are specified in the form of `low..high`. For example, `days(1..5)` equals the first five days of the month. The order of low and high is significant, and in cases where `low > high` it will be interpreted as a range which wraps. In other words, `minutes(58..2)` means it will run on minutes 58, 59, 0, 1, and 2.
* The modulus operator `%` can be used to define intervals. `seconds(%2)` will run on all even seconds. `seconds(7%3)` will run at 7,10,13, ...,55, and 58 seconds of every minute. `seconds(7..19%4)` will run at 7,11,15, and 19 seconds. `seconds(57..4%2)` will run at 57,59,1, and 3 seconds. Note that the modulus operation is always relative to the low value in the range.

## Expressions

Expressions allow you to define when you want events to occur or when you explicitly do not want them to occur. If your format string does not contain any expressions, it will be invalid and schyntax will throw an exception.

### seconds

Aliases: `s`, `sec`, `second`, `secondOfMinute`, `secondsOfMinute`

Accepts numbers and numeric-range arguments between 0 and 59 inclusive.

### minutes

Aliases: `m`, `min`, `minute`, `minuteofhour`, `minutesOfHour`

Accepts numbers and numeric-range arguments between 0 and 59 inclusive.

### hours

Aliases: `h`, `hour`, `hourOfDay`, `hoursOfDay`

Accepts numbers and numeric-range arguments between 0 and 23 inclusive.

### daysOfWeek

Aliases: `day`, `days`, `dayOfWeek`, `dow`

Accepts numbers and numeric-range arguments between 1 (Sunday) and 7 (Saturday) inclusive. Additionally, you may use textual days. Two or three-character abbreviations are accepted (such as `mo..th` or `mon..thu`) as well as full names (`monday..thursday`). Because `tues`, `thur`, and `thurs` are common abbreviations, those special cases are also accepted, but it may be better to stick to the more predictable 2-3 characters.

### daysOfMonth

Aliases: `dom`, `dayOfMonth`

Accepts numbers and numeric-range arguments between 1 and 31 inclusive. A second range from -31 to -1 is also allowed and are counted as days from the end of the month.

Examples:

* `dom(-1)` The last day of the month.
* `dom(-5..-1)` the last five days of the month.
* `dom(10..-1)` The 10th through the last day of the month.

### dates

Aliases: `date`

Allows you to include or exclude specific dates or date ranges. Date arguments take the form of `m/d`. Date ranges are `m/d-m/d` and are allowed to span across January 1st.

Examples:

* `dates(!12/25, !7/4)` Run every day except December 25th and July 4th.
* `dates(4/1)` Only run on April 1st.
* `dates(4/1 .. 4/30)` Only run for the month of April.
* `dates(4/1 .. 4/30, !4/16)` Run every day in April except for April 16th.
* `dates(!12/25 .. 1/1)` Run every day except December 25th through January 1st.

## Defaults

When a format string does not include all expression types, some assumptions must be made about the missing values. Schyntax looks at the expression with the highest-resolution, and then sets `exp_name(0)` for any higher-resolution expressions. For example, if `hours` is the highest resolution specified, then `minutes(0) seconds(0)` is implicitly added to the format. All day-level expressions (`daysOfWeek`, `daysOfMonth`, `dates`) are treated as the same resolution. Any other (lower-resolution) missing expression types are considered wildcards, meaning they will match any date/time (equivalent to not sending any arguments to an expression `exp_name()`).

Here are some examples which illustrate these defaults:

* `minutes(10)` will run at ten minutes after the top of every hour on every day.
* `hours(12)` will run at noon UTC everyday.
* `daysOfWeek(mon..fri)` will run at midnight UTC Mondays through Fridays.
* `daysOfWeek(mon) hours(12)` will run at noon UTC on Mondays.
* `daysOfWeek(mon) minutes(0, 30)` will run at the top and half of every hour on Mondays.

## Groups

Expressions can be grouped using the `group(expression, expression, ... )` syntax. This allows you to setup sets of expressions which are evaluated independently from each other. For example, you may want to have a different set of rules for weekdays vs. weekends.

Examples:

* `group(hours(10), days(!sat..sun)) group(hours(12), days(sat..sun))` Runs 10:00 on weekdays, and noon on weekends.
* `group(dates(10/1 .. 3/31) hours(12)) group(dates(4/1 .. 9/30) hours(14))` Runs 12:00 during October through March, and at 14:00 during April through September.

When [schyntax#next](#schyntax-next) or [schyntax#previous](#schyntax-previous) are called, all groups are evaluated to find the next or previous applicable date, and they return which ever date which is closest.  All expressions not inside a `group()` are collected and implicitly put into a group.

Nesting of groups is not allowed.

> Note that, unlike the argument list inside expressions, the commas in the group syntax are optional. `group(exp exp exp ... )` is also valid.

## Contributing

Bug fixes are always welcome. If you would like to contribute features to the schyntax expression language, open an issue with your proposed functionality, syntax changes, and use cases _BEFORE_ you submit a pull request so that it can be discussed.
