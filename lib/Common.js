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
 * @returns {number}
 */
Common.daysInMonth = function (month)
{
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
			return 29;
	}

	throw new Error('Unknown Month ' + month);
};
