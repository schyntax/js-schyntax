"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

//

/* =============================================================================
 * 
 * Token Class
 * 
 * Represents a syntax token.
 *  
 * ========================================================================== */

module.exports = Token;

function Token (index, specialChar)
{
	this.index = index;
	this.value = specialChar || '';
	this.isSpecial = !!specialChar;
}

/* -------------------------------------------------------------------
 * Public Members Declaration << no methods >>
 * ---------------------------------------------------------------- */

Object.defineProperty(Token.prototype, 'isExpression', {
	get: function ()
	{
		return this.isKeyword && !this.isDayKeyword;
	}
});

Object.defineProperty(Token.prototype, 'isDayKeyword', {
	get: function ()
	{
		return this.toDayOfWeek() !== -1;
	}
});

Object.defineProperty(Token.prototype, 'isKeyword', {
	get: function ()
	{
		return /^[a-z_][a-z0-9_]*$/i.test(this.value);
	}
});

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

Token.prototype.toDayOfWeek = function ()
{
	switch (this.value.toLowerCase())
	{
		case 'su':
		case 'sun':
		case 'sunday':
			return 1;
		case 'mo':
		case 'mon':
		case 'monday':
			return 2;
		case 'tu':
		case 'tue':
		case 'tues':
		case 'tuesday':
			return 3;
		case 'we':
		case 'wed':
		case 'wednesday':
			return 4;
		case 'th':
		case 'thu':
		case 'thur':
		case 'thurs':
		case 'thursday':
			return 5;
		case 'fr':
		case 'fri':
		case 'friday':
			return 6;
		case 'sa':
		case 'sat':
		case 'saturday':
			return 7;
		default:
			return -1;
	}
};
