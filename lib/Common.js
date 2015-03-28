"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

//

/* =============================================================================
 * 
 * Common Utilities
 *  
 * ========================================================================== */

var Common = module.exports;

/* -------------------------------------------------------------------
 * Public Static Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

/**
 * @param month {number} The zero-indexed month.
 * @param [year] {number}
 * @returns {number}
 */
Common.daysInMonth = function (month, year)
{
	if (month < 0)
	{
		month = 12 + month;
		if (year)
			year--;
	}
	
	switch (month)
	{
		case 0:
		case 2:
		case 4:
		case 6:
		case 7:
		case 9:
		case 11:
			return 31;
		case 3:
		case 5:
		case 8:
		case 10:
			return 30;
		case 1:
			if (!year)
				return 29;
			else // check if there are 28 or 29 days in feb this year
				return new Date(year, 1, 29).getMonth() === 1 ? 29 : 28;
	}

	throw new Error('Unknown Month ' + month);
};
