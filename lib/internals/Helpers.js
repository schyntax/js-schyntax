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
	if (month === 2) // February is weird
	{
		if (year === null)
			year = 2000; // default to a leap year, if no year is specified

		if (new Date(year, 1, 29).getDate() === 29)
			return 29;

		return 28;
	}

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
	}

	throw new Error("Invalid month " + month + Exceptions.PLEASE_REPORT_BUG_MSG);
};
