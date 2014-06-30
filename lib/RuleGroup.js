"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Common = require('./Common');

/* =============================================================================
 * 
 * RuleGroup Class
 * 
 * Defines a schedule for a scheduled task. 
 *  
 * ========================================================================== */

module.exports = RuleGroup;

function RuleGroup ()
{
	/* -------------------------------------------------------------------
	 * Public Members Declaration << no methods >>
	 * ---------------------------------------------------------------- */
	
	this.seconds = null;
	this.secondsExclude = null;
	this.minutes = null;
	this.minutesExclude = null;
	this.hours = null;
	this.hoursExclude = null;
	this.daysOfWeek = null;
	this.daysOfWeekExclude = null;
	this.daysOfMonth = null;
	this.daysOfMonthExclude = null;
	this.dates = null;
	this.datesExclude = null;
}

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

/**
 * @param start {Date}
 * @param after {boolean}
 * @returns {?Date}
 */
RuleGroup.prototype.getEvent = function (start, after)
{
	var year, date, dayOfWeek, month, dayOfMonth, hour, minute, second;
	var firstHour, hourCount, minuteCount, secondCount;
	var i;
	var applicable;
	var daysInMonth;
	var inc = after ? 1 : -1;
	/** @type {Range} */
	var range;
	
	var initHour = after ? 0 : 23;
	var initMinute = after ? 0 : 59;
	var initSecond = after ? 0 : 59;

	date_loop:
	for (var d = 0; d < 367; d++)
	{
		date = new Date(start);
		date.setUTCDate(date.getUTCDate() + d * inc);

		if (d > 0)
		{
			date.setUTCHours(initHour);
			date.setUTCMinutes(initMinute);
			date.setUTCSeconds(initSecond);
		}
		else if (after)
		{
			// "after" events must be in the future
			date.setUTCSeconds(date.getUTCSeconds() + 1);
		}

		year = date.getUTCFullYear();
		dayOfWeek = date.getUTCDay();
		dayOfMonth = date.getUTCDate();
		month = date.getUTCMonth();
		hour = date.getUTCHours();
		minute = date.getUTCMinutes();
		second = date.getUTCSeconds();
		daysInMonth = Common.daysInMonth(month, date.getUTCFullYear());

		// check if today is an applicable date
		if (this.dates)
		{
			applicable = false;
			for (i = 0; i < this.dates.length; i++)
			{
				range = this.dates[i];
				if (inDateRange(month, dayOfMonth, year, range))
				{
					applicable = true;
					break;
				}
			}

			if (!applicable)
				continue;
		}

		if (this.datesExclude)
		{
			for (i = 0; i < this.datesExclude.length; i++)
			{
				range = this.datesExclude[i];
				if (inDateRange(month, dayOfMonth, year, range))
					continue date_loop;
			}
		}

		// check if date is an applicable day of month
		if (this.daysOfMonth)
		{
			applicable = false;
			for (i = 0; i < this.daysOfMonth.length; i++)
			{
				range = this.daysOfMonth[i];
				range = range.copy();
				
				if (range.low < 0)
					range.low = daysInMonth + range.low + 1;

				if (range.high < 0)
					range.high = daysInMonth + range.high + 1;

				if (inRange(dayOfMonth, range, Common.daysInMonth(month - 1, year), 1))
				{
					applicable = true;
					break;
				}
			}

			if (!applicable)
				continue date_loop;
		}

		if (this.daysOfMonthExclude)
		{
			for (i = 0; i < this.daysOfMonthExclude.length; i++)
			{
				range = this.daysOfMonthExclude[i];
				range = range.copy();

				if (range.low < 0)
					range.low = daysInMonth + range.low + 1;

				if (range.high < 0)
					range.high = daysInMonth + range.high + 1;

				if (inRange(dayOfMonth, range, Common.daysInMonth(month - 1, year), 1))
					continue date_loop;
			}
		}

		// check if date is an applicable day of week
		if (this.daysOfWeek && !this.inRule('daysOfWeek', dayOfWeek))
			continue;

		if (this.daysOfWeekExclude && this.inRule('daysOfWeekExclude', dayOfWeek))
			continue;

		// if we've gotten this far, then today is an applicable day, let's keep going with hour checks
		firstHour = true;
		hourCount = after ? 24 - hour : hour + 1;
		for (; hourCount--; hour += inc, minute = initMinute, second = initSecond)
		{
			if (this.hours && !this.inRule('hours', hour))
				continue;

			if (this.hoursExclude && this.inRule('hoursExclude', hour))
				continue;

			// if we've gotten here, the date and hour are valid. Let's check for minutes
			minuteCount = after ? 60 - minute : minute + 1;
			for (; minuteCount--; minute += inc, second = initSecond)
			{
				if (this.minutes && !this.inRule('minutes', minute))
					continue;

				if (this.minutesExclude && this.inRule('minutesExclude', minute))
					continue;
				
				// check for valid seconds
				secondCount = after ? 60 - second : second + 1;
				for (; secondCount--; second += inc)
				{
					if (this.seconds && !this.inRule('seconds', second))
						continue;
					
					if (this.secondsExclude && this.inRule('secondsExclude', second))
						continue;
					
					// we've found our next event
					return new Date(Date.UTC(date.getUTCFullYear(), month, dayOfMonth, hour, minute, second));
				}
			}
		}
	}

	return null;
};

/**
 * @param property {string}
 * @param value {number}
 * @returns {boolean}
 */
RuleGroup.prototype.inRule = function (property, value)
{
	var lengthOfUnit;
	switch (property)
	{
		case 'daysOfWeek':
		case 'daysOfWeekExclude':
			lengthOfUnit = 7;
			break;
		case 'hours':
		case 'hoursExclude':
			lengthOfUnit = 24;
			break;
		case 'minutes':
		case 'minutesExclude':
		case 'seconds':
		case 'secondsExclude':
			lengthOfUnit = 60;
			break;
		default:
			throw new Error('Property not implemented in RuleGroup.inRule function. ' + property);
	}

	var rule = this[property];
	for (var i = 0; i < rule.length; i++)
	{
		if (inRange(value, rule[i], lengthOfUnit))
			return true;
	}

	return false;
};

/* -------------------------------------------------------------------
 * Private Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

/**
 * @param month {number}
 * @param day {number}
 * @param year {number}
 * @param range {Range}
 * @returns {boolean}
 */
function inDateRange (month, day, year, range)
{
	// first, check if in-between low and high dates.
	if (range.isSplit)
	{
		if (month === range.low.month || month === range.high.month)
		{
			if (month === range.low.month && day < range.low.day)
				return false;
			
			if (month === range.high.month && day > range.high.day)
				return false;
		}
		else if (!(month < range.high.month || month > range.low.month))
		{
			return false;
		}
	}
	else
	{
		// start with month range check
		if (month < range.low.month || month > range.high.month)
			return false;
		
		if (month === range.low.month || month === range.high.month)
		{
			// month is equal, so check month and day
			if (month === range.low.month && day < range.low.day)
				return false;

			if (month === range.high.month && day > range.high.day)
				return false;
		}
	}
	
	if (!range.modulus) // if there's no modulus, in-between dates is the only comparison required
		return true;
	
	// figure out the actual date of the low date
	var start;
	if (range.isSplit && month <= range.high.month)
	{
		// start date is from previous year
		start = new Date(Date.UTC(year - 1, range.low.month, range.low.day));
	}
	else
	{
		start = new Date(Date.UTC(year, range.low.month, range.low.day));
	}
	
	// check if start date was actually supposed to be February 29th, but isn't because of non-leap-year.
	if (range.low.month === 1 && range.low.day === 29 && start.getUTCMonth() !== 1)
	{
		// bump the start day back to February 28th so that modulus schemes work based on that imaginary date
		// but seriously, people should probably just expect weird results if they're doing something that stupid.
		start.setUTCDate(start.getUTCDate() - 1);
	}
	
	var current = new Date(Date.UTC(year, month, day));
	var dayCount = Math.round((current - start) / (24 * 60 * 60 * 1000));
	
	return dayCount % range.modulus === 0;
}

/**
 * @param value {number}
 * @param range {Range}
 * @param lengthOfUnit {number}
 * @param [min] {number}
 * @returns {boolean}
 */
function inRange (value, range, lengthOfUnit, min)
{
	min = min || 0;
	
	if (range.isSplit) // range spans across the max value and loops back around
	{
		if (value <= range.high || value >= range.low)
		{
			if (range.modulus)
			{
				if (value > range.low)
					return (value - range.low) % range.modulus === 0;
				
				return (value + lengthOfUnit - range.low) % range.modulus === 0;
			}
			
			return true;
		}
	}
	else // not a split range (easier case)
	{
		if (value >= range.low && value <= range.high)
		{
			if (range.modulus)
				return (value - range.low) % range.modulus === 0;

			return true;
		}
	}
	
	return false;
}
