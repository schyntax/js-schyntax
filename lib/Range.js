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
 * Public Members << no methods >>
 * ---------------------------------------------------------------- */

Object.defineProperty(Range.prototype, 'day', {
	get: function () { return this.high; },
	set: function (val) { return this.high = val; }
});

Object.defineProperty(Range.prototype, 'month', {
	get: function () { return this.low; },
	set: function (val) { return this.low = val; }
});

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

Range.prototype.copy = function ()
{
	return new Range(this.low, this.high);
};
