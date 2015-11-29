"use strict";

/* =============================================================================
 * 
 * Ir
 *  
 * ========================================================================== */

module.exports = Ir;

function Ir ()
{
}

/* ===========================================================================*/

Ir.Program = function ()
{
	/** @member {Ir.Group[]} */
	this.groups = [];
};

/* ===========================================================================*/

Ir.Group = function ()
{
	/** @member {Ir.IntegerRange[]} */
	this.seconds = [];
	/** @member {Ir.IntegerRange[]} */
	this.secondsExcluded = [];
	/** @member {Ir.IntegerRange[]} */
	this.minutes = [];
	/** @member {Ir.IntegerRange[]} */
	this.minutesExcluded = [];
	/** @member {Ir.IntegerRange[]} */
	this.hours = [];
	/** @member {Ir.IntegerRange[]} */
	this.hoursExcluded = [];
	/** @member {Ir.IntegerRange[]} */
	this.daysOfWeek = [];
	/** @member {Ir.IntegerRange[]} */
	this.daysOfWeekExcluded = [];
	/** @member {Ir.IntegerRange[]} */
	this.daysOfMonth = [];
	/** @member {Ir.IntegerRange[]} */
	this.daysOfMonthExcluded = [];
	/** @member {Ir.DateRange[]} */
	this.daysOfYear = [];
	/** @member {Ir.DateRange[]} */
	this.daysOfYearExcluded = [];
	/** @member {Ir.DateRange[]} */
	this.dates = [];
	/** @member {Ir.DateRange[]} */
	this.datesExcluded = [];
};

Object.defineProperty(Ir.Group.prototype, 'hasSeconds', { get: function () { return this.seconds.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasSecondsExcluded', { get: function () { return this.secondsExcluded.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasMinutes', { get: function () { return this.minutes.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasMinutesExcluded', { get: function () { return this.minutesExcluded.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasHours', { get: function () { return this.hours.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasHoursExcluded', { get: function () { return this.hoursExcluded.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasDaysOfWeek', { get: function () { return this.daysOfWeek.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasDaysOfWeekExcluded', { get: function () { return this.daysOfWeekExcluded.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasDaysOfMonth', { get: function () { return this.daysOfMonth.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasDaysOfMonthExcluded', { get: function () { return this.daysOfMonthExcluded.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasDaysOfYear', { get: function () { return this.daysOfYear.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasDaysOfYearExcluded', { get: function () { return this.daysOfYearExcluded.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasDates', { get: function () { return this.dates.length > 0; } });
Object.defineProperty(Ir.Group.prototype, 'hasDatesExcluded', { get: function () { return this.datesExcluded.length > 0; } });

/* ===========================================================================*/

/**
 * @param start {number}
 * @param end {?number}
 * @param interval {number}
 * @param isSplit {boolean}
 * @param isHalfOpen {boolean}
 * @constructor
 */
Ir.IntegerRange = function (start, end, interval, isSplit, isHalfOpen)
{
	this.isRange = false;
	this.isHalfOpen = false;
	this.isSplit = false;
	this.start = start;
	this.end = 0;
	
	if (typeof end === 'number')
	{
		this.isSplit = isSplit;
		this.isHalfOpen = isHalfOpen;
		this.isRange = true;
		this.end = end;
	}
	this.interval = interval;
	this.hasInterval = interval !== 0;
};

/**
 * @param start {number}
 * @param end {number}
 */
Ir.IntegerRange.prototype.cloneWithRevisedRange = function (start, end)
{
	return new Ir.IntegerRange(start, this.isRange ? end : null, this.interval, this.isSplit, this.isHalfOpen);
};

/* ===========================================================================*/

/**
 * @param start {Ir.Date}
 * @param end {?Ir.Date}
 * @param interval {number}
 * @param isSplit {boolean}
 * @param isHalfOpen {boolean}
 * @constructor
 */
Ir.DateRange = function (start, end, interval, isSplit, isHalfOpen)
{
	this.isRange = false;
	this.isHalfOpen = false;
	this.isSplit = false;
	/** @member {Ir.Date} */
	this.start = start;
	/** @member {?Ir.Date} */
	this.end = null;
	this.datesHaveYear = start.year !== 0;
	
	if (end)
	{
		this.isRange = true;
		this.isSplit = isSplit;
		this.isHalfOpen = isHalfOpen;
		this.end = end;
	}
	
	this.interval = interval;
	this.hasInterval = interval !== 0;
};

/* ===========================================================================*/

/**
 * @param year {?number}
 * @param month {number}
 * @param day {number}
 * @constructor
 */
Ir.Date = function (year, month, day)
{
	this.year = year ? year : 0;
	this.month = month;
	this.day = day;
};
