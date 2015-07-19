"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Exceptions = require('./internals/Exceptions');
var Helpers = require('./internals/Helpers');
var IrBuilder = require('./internals/IrBuilder');
var Parser = require('./internals/Parser');
var Validator = require('./internals/Validator');

/* =============================================================================
 * 
 * Schedule
 *  
 * ========================================================================== */

module.exports = Schedule;

/**
 * @param schedule {string}
 * @constructor
 */
function Schedule (schedule)
{
	this.originalText = schedule;
	
	var parser = new Parser(schedule);
	var ast = parser.parse();
	
	var validator = new Validator(schedule, ast);
	validator.assertValid();
	
	this._ir = IrBuilder.compileAst(ast);
}

var SearchMode = {
	AtOrBefore: 0,
	After: 1
};

/* -------------------------------------------------------------------
 * Prototype Methods
 * ---------------------------------------------------------------- */

/**
 * @param [after] {Date}
 * @return {Date}
 */
Schedule.prototype.next = function (after)
{
	return this._getEvent(after, SearchMode.After);
};

/**
 * @param [atOrBefore] {Date}
 * @return {Date}
 */
Schedule.prototype.previous = function (atOrBefore)
{
	return this._getEvent(atOrBefore, SearchMode.AtOrBefore);
};

/**
 * @param start {Date}
 * @param mode {number}
 * @return {Date}
 * @private
 */
Schedule.prototype._getEvent = function (start, mode)
{
	if (!start)
		start = new Date();
	
	var found = false;
	var result = null;
	
	var groups = this._ir.groups;
	for (var i = 0; i < groups.length; i++)
	{
		var e = getGroupEvent(groups[i], start, mode);
		if (e)
		{
			if (!found
				|| (mode === SearchMode.After && e < result)
				|| (mode === SearchMode.AtOrBefore && e > result))
			{
				result = e;
				found = true;
			}
		}
	}
	
	if (!found)
		throw new Exceptions.ValidTimeNotFoundError(this.originalText);
	
	return result;
};

/* -------------------------------------------------------------------
 * Static Methods
 * ---------------------------------------------------------------- */

/**
 * @param group {Ir.Group}
 * @param start {Date}
 * @param mode {number}
 * @return {?Date}
 */
function getGroupEvent (group, start, mode)
{
	var after = mode === SearchMode.After;
	var inc = after ? 1 : -1; // used for incrementing values up or down depending on the direction we're searching

	var initHour = after ? 0 : 23;
	var initMinute = after ? 0 : 59;
	var initSecond = after ? 0 : 59;
	
	var applicable, i;

	// todo: make the length of the search configurable
	date_loop:
	for (var d = 0; d < 367; d++)
	{
		var date = new Date(start);
		var hour, minute, second;
		if (d === 0)
		{
			if (after)
				date.setUTCSeconds(date.getUTCSeconds() + 1); // "after" events must be in the future
			
			hour = date.getUTCHours();
			minute = date.getUTCMinutes();
			second = date.getUTCSeconds();
		}
		else
		{
			date.setUTCDate(date.getUTCDate() + d * inc);
			
			hour = initHour;
			minute = initMinute;
			second = initSecond;
		}
		
		var year = date.getUTCFullYear();
		var month = date.getUTCMonth() + 1;
		var dayOfWeek = date.getUTCDay() + 1;
		var dayOfMonth = date.getUTCDate();

		// check if today is an applicable date
		if (group.hasDates)
		{
			applicable = false;
			for (i = 0; i < group.dates.length; i++)
			{
				if (inDateRange(group.dates[i], year, month, dayOfMonth))
				{
					applicable = true;
					break;
				}
			}
			
			if (!applicable)
				continue date_loop;
		}
		
		if (group.hasDatesExcluded)
		{
			for (i = 0; i < group.datesExcluded.length; i++)
			{
				if (inDateRange(group.datesExcluded[i], year, month, dayOfMonth))
					continue date_loop;
			}
		}

		// check if date is an applicable day of month
		if (group.hasDaysOfMonth)
		{
			applicable = false;
			for (i = 0; i < group.daysOfMonth.length; i++)
			{
				if (inDayOfMonthRange(group.daysOfMonth[i], year, month, dayOfMonth))
				{
					applicable = true;
					break;
				}
			}
			
			if (!applicable)
				continue date_loop;
		}
		
		if (group.hasDaysOfMonthExcluded)
		{
			for (i = 0; i < group.daysOfMonthExcluded.length; i++)
			{
				if (inDayOfMonthRange(group.daysOfMonthExcluded[i], year, month, dayOfMonth))
					continue date_loop;
			}
		}
		
		// check if date is an applicable day of week
		if (group.hasDaysOfWeek && !inRule(7, group.daysOfWeek, dayOfWeek))
			continue date_loop;

		if (group.hasDaysOfWeekExcluded && inRule(7, group.daysOfWeekExcluded, dayOfWeek))
			continue date_loop;
		
		// if we've gotten this far, then today is an applicable day, let's keep going with hour checks
		var hourCount = after ? 24 - hour : hour + 1;
		for (; hourCount-- > 0; hour += inc, minute = initMinute, second = initSecond)
		{
			if (group.hasHours && !inRule(24, group.hours, hour))
				continue;

			if (group.hasHoursExcluded && inRule(24, group.hoursExcluded, hour))
				continue;

			// if we've gotten here, the date and hour are valid. Let's check for minutes
			var minuteCount = after ? 60 - minute : minute + 1;
			for (; minuteCount-- > 0; minute += inc, second = initSecond)
			{
				if (group.hasMinutes && !inRule(60, group.minutes, minute))
					continue;

				if (group.hasMinutesExcluded && inRule(60, group.minutesExcluded, minute))
					continue;

				// check for valid seconds
				var secondCount = after ? 60 - second : second + 1;
				for (; secondCount-- > 0; second += inc)
				{
					if (group.hasSeconds && !inRule(60, group.seconds, second))
						continue;

					if (group.hasSecondsExcluded && inRule(60, group.secondsExcluded, second))
						continue;

					// we've found our event
					var ms = Date.UTC(year, month - 1, dayOfMonth, hour, minute, second);
					return new Date(ms);
				}
			}
		}
	}
	
	return null;
}

/**
 * @param lengthOfUnit {number}
 * @param ranges {Ir.IntegerRange[]}
 * @param value {number}
 * @return {boolean}
 */
function inRule (lengthOfUnit, ranges, value)
{
	for (var i = 0; i < ranges.length; i++)
	{
		if (inIntegerRange(ranges[i], value, lengthOfUnit))
			return true;
	}
	
	return false;
}

/**
 * @param range {Ir.DateRange}
 * @param year {number}
 * @param month {number}
 * @param dayOfMonth {number}
 * @return {boolean}
 */
function inDateRange (range, year, month, dayOfMonth)
{
	// first, check if this is actually a range
	if (!range.isRange)
	{
		// not a range, so just to a straight comparison
		if (range.start.month !== month || range.start.day !== dayOfMonth)
			return false;

		if (range.datesHaveYear && range.start.year !== year)
			return false;

		return true;
	}

	if (range.isHalfOpen)
	{
		// check if this is the last date in a half-open range
		var end = range.end;
		if (end.day === dayOfMonth && end.month === month && (!range.datesHaveYear || end.year === year))
			return false;
	}

	// check if in-between start and end dates.
	if (range.datesHaveYear)
	{
		// when we have a year, the check is much simpler because the range can't be split
		if (year < range.start.year || year > range.end.year)
			return false;

		if (year === range.start.year && compareMonthAndDay(month, dayOfMonth, range.start.month, range.start.day) === -1)
			return false;

		if (year === range.end.year && compareMonthAndDay(month, dayOfMonth, range.end.month, range.end.day) === 1)
			return false;
	}
	else if (range.isSplit) // split ranges aren't allowed to have years (it wouldn't make any sense)
	{
		if (month === range.start.month || month === range.end.month)
		{
			if (month === range.start.month && dayOfMonth < range.start.day)
				return false;

			if (month === range.end.month && dayOfMonth > range.end.day)
				return false;
		}
		else if (!(month < range.end.month || month > range.start.month))
		{
			return false;
		}
	}
	else
	{
		// not a split range, and no year information - just month and day to go on
		if (compareMonthAndDay(month, dayOfMonth, range.start.month, range.start.day) === -1)
			return false;

		if (compareMonthAndDay(month, dayOfMonth, range.end.month, range.end.day) === 1)
			return false;
	}

	// If we get here, then we're definitely somewhere within the range.
	// If there's no interval, then there's nothing else we need to check
	if (!range.hasInterval)
		return true;

	// figure out the actual date of the low date so we know whether we're on the desired interval
	var startYear;
	if (range.datesHaveYear)
	{
		startYear = range.start.year;
	}
	else if (range.isSplit && month <= range.end.month)
	{
		// start date is from the previous year
		startYear = year - 1;
	}
	else
	{
		startYear = year;
	}

	var startDay = range.start.day;

	// check if start date was actually supposed to be February 29th, but isn't because of non-leap-year.
	if (range.start.month === 2 && range.start.day === 29 && Helpers.daysInMonth(startYear, 2) != 29)
	{
		// bump the start day back to February 28th so that interval schemes work based on that imaginary date
		// but seriously, people should probably just expect weird results if they're doing something that stupid.
		startDay = 28;
	}

	var start = Date.UTC(startYear, range.start.month - 1, startDay, 0, 0, 0);
	var current = Date.UTC(year, month - 1, dayOfMonth, 0, 0, 0);
	var dayCount = Math.round((current - start) / (24 * 60 * 60 * 1000));

	return (dayCount % range.interval) === 0;
}

/**
 * returns 0 if A and B are equal, -1 if A is before B, or 1 if A is after B
 * @param monthA {number}
 * @param dayA {number}
 * @param monthB {number}
 * @param dayB {number}
 * @return {number}
 */
function compareMonthAndDay (monthA, dayA, monthB, dayB)
{
	if (monthA == monthB)
	{
		if (dayA == dayB)
			return 0;

		return dayA > dayB ? 1 : -1;
	}

	return monthA > monthB ? 1 : -1;
}

/**
 * @param range {Ir.IntegerRange}
 * @param year {number}
 * @param month {number}
 * @param dayOfMonth {number}
 * @return {boolean}
 */
function inDayOfMonthRange (range, year, month, dayOfMonth)
{
	if (range.start < 0 || (range.isRange && range.end < 0))
	{
		// one of the range values is negative, so we need to convert it to a positive by counting back from the end of the month
		var daysInMonth = Helpers.daysInMonth(year, month);
		range = range.cloneWithRevisedRange(
			range.start < 0 ? daysInMonth + range.start + 1 : range.start,
			range.end < 0 ? daysInMonth + range.end + 1 : range.end
		);
	}

	return inIntegerRange(range, dayOfMonth, daysInPreviousMonth(year, month), 1);
}

/**
 * @param range {Ir.IntegerRange}
 * @param value {number}
 * @param lengthOfUnit {number}
 * @param [min] {number}
 * @return {boolean}
 */
function inIntegerRange (range, value, lengthOfUnit, min)
{
	if (!min)
		min = 0;

	if (!range.isRange)
	{
		return value === range.start;
	}

	if (range.isHalfOpen && value === range.end)
		return false;

	if (range.isSplit) // range spans across the max value and loops back around
	{
		if (value <= range.end || value >= range.start)
		{
			if (range.hasInterval)
			{
				if (value >= range.start)
					return (value - range.start) % range.interval === 0;

				return (value + lengthOfUnit - range.start) % range.interval === 0;
			}

			return true;
		}
	}
	else // not a split range (easier case)
	{
		if (value >= range.start && value <= range.end)
		{
			if (range.hasInterval)
				return (value - range.start) % range.interval === 0;

			return true;
		}
	}

	return false;
}

/**
 * @param year {number}
 * @param month {number}
 * @return {number}
 */
function daysInPreviousMonth (year, month)
{
	month--;
	if (month === 0)
	{
		year--;
		month = 12;
	}

	return Helpers.daysInMonth(year, month);
}
