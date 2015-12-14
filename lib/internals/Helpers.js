"use strict";

/* =============================================================================
 * 
 * Helpers
 *  
 * ========================================================================== */

var Helpers = {};
module.exports = Helpers;

Helpers.daysInMonth = function daysInMonth (year, month)
{
	switch (month)
	{
		case 1:
		case 3:
		case 5:
		case 7:
		case 8:
		case 10:
		case 12:
			return 31;
		case 4:
		case 6:
		case 9:
		case 11:
			return 30;
		case 2:
			// February is weird
			if (year === null)
				return 29; // default to a leap year, if no year is specified

			return Helpers.isLeapYear(year) ? 29 : 28;
	}

	throw new Error("Invalid month " + month + Exceptions.PLEASE_REPORT_BUG_MSG);
};

var _daysInPreviousMonths = [
	0,   // January
	31,  // February
	59,  // March
	90,  // April
	120, // May
	151, // June
	181, // July
	212, // August
	243, // September
	273, // October
	304, // November
	334, // December
];

/**
 * @param date {Date}
 * @returns {number}
 */
Helpers.dayOfYear = function dayOfYear(date)
{
	var doy = date.getUTCDate();
	var month = date.getUTCMonth();
	
	doy += _daysInPreviousMonths[month];
	
	// remember, months are zero-indexed on JavaScript Dates
	if (month > 1 && Helpers.isLeapYear(date.getUTCFullYear()))
		doy++;
	
	return doy;
};

Helpers.isLeapYear = function isLeapYear(year)
{
	return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
};
