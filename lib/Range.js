"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

//

/* =============================================================================
 * 
 * Range Class
 * 
 * Represents high and low value as a range
 *  
 * ========================================================================== */

module.exports = Range;

/**
 * @param low {number}
 * @param high {number}
 * @constructor
 */
function Range (low, high)
{
	this.low = low;
	this.high = high;
}

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

Range.prototype.copy = function ()
{
	return new Range(this.low, this.high);
};
