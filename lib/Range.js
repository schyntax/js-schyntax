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
 * @param [isSplit] {boolean}
 * @param [modulus] {number}
 * @constructor
 */
function Range (low, high, isSplit, modulus)
{
	this.low = low;
	this.high = high;
	this.isSplit = !!isSplit;
	this.modulus = modulus || 0;
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
	return new Range(this.low, this.high, this.isSplit, this.modulus);
};
