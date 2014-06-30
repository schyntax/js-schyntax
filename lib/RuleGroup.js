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
	var date, dayOfWeek, month, dayOfMonth, hour, minute, second;
	var firstHour, hourCount, minuteCount, secondCount;
	var i;
	var applicable;
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

		dayOfWeek = date.getUTCDay();
		dayOfMonth = date.getUTCDate();
		month = date.getUTCMonth();
		hour = date.getUTCHours();
		minute = date.getUTCMinutes();
		second = date.getUTCSeconds();

		// check if today is an applicable date
		if (this.dates)
		{
			applicable = false;
			for (i = 0; i < this.dates.length; i++)
			{
				range = this.dates[i];
				if (inDateRange(month, dayOfMonth, range))
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
				if (inDateRange(month, dayOfMonth, range))
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
					range.low = Common.daysInMonth(month, date.getUTCFullYear()) + range.low + 1;

				if (range.high < 0)
					range.high = Common.daysInMonth(month, date.getUTCFullYear()) + range.high + 1;

				if (inRange(dayOfMonth, range))
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
					range.low = Common.daysInMonth(month) + range.low + 1;

				if (range.high < 0)
					range.high = Common.daysInMonth(month) + range.high + 1;

				if (inRange(dayOfMonth, range))
					continue date_loop;
			}
		}

		// check if date is an applicable day of week
		if (this.daysOfWeek && !inRule(this.daysOfWeek, dayOfWeek))
			continue;

		if (this.daysOfWeekExclude && inRule(this.daysOfWeekExclude, dayOfWeek))
			continue;

		// if we've gotten this far, then today is an applicable day, let's keep going with hour checks
		firstHour = true;
		hourCount = after ? 24 - hour : hour + 1;
		for (; hourCount--; hour += inc, minute = initMinute, second = initSecond)
		{
			if (this.hours && !inRule(this.hours, hour))
				continue;

			if (this.hoursExclude && inRule(this.hoursExclude, hour))
				continue;

			// if we've gotten here, the date and hour are valid. Let's check for minutes
			minuteCount = after ? 60 - minute : minute + 1;
			for (; minuteCount--; minute += inc, second = initSecond)
			{
				if (this.minutes && !inRule(this.minutes, minute))
					continue;

				if (this.minutesExclude && inRule(this.minutesExclude, minute))
					continue;
				
				// check for valid seconds
				secondCount = after ? 60 - second : second + 1;
				for (; secondCount--; second += inc)
				{
					if (this.seconds && !inRule(this.seconds, second))
						continue;
					
					if (this.secondsExclude && inRule(this.secondsExclude, second))
						continue;
					
					// we've found our next event
					return new Date(Date.UTC(date.getUTCFullYear(), month, dayOfMonth, hour, minute, second));
				}

			}
		}
	}

	return null;
};

/* -------------------------------------------------------------------
 * Private Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

function inDateRange (month, day, range)
{
	if (month === range.low.month || month === range.high.month)
	{
		if (month === range.low.month && day < range.low.day)
			return false;

		if (month === range.high.month && day > range.high.day)
			return false;
		
		return true;
	}
	
	// not equal to start or end month, so we can just test on month
	return month > range.low.month && month < range.high.month;
}

/**
 * @param value {number}
 * @param range {Range}
 * @returns {boolean}
 */
function inRange (value, range)
{
	return value >= range.low && value <= range.high;
}

/**
 * @param rule {Range[]}
 * @param value {number}
 * @returns {boolean}
 */
function inRule (rule, value)
{
	for (var i = 0; i < rule.length; i++)
	{
		if (inRange(value, rule[i]))
			return true;
	}

	return false;
}
