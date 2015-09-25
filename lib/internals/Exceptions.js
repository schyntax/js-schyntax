"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Util = require('util');

/* =============================================================================
 * 
 * Exceptions
 *  
 * ========================================================================== */

var Exceptions = module.exports = {};

Exceptions.PLEASE_REPORT_BUG_MSG = " This indicates a bug in Schyntax. Please open an issue on github.";

/**
 * 
 * @param input {string}
 * @param index {number}
 * @return {string}
 */
Exceptions.getPointerToIndex = function (input, index)
{
	var start = Math.max(0, index - 20);
	var length = Math.min(input.length - start, 50);
	
	var str = input.substr(start, length) + '\n';
	
	for (var i = start; i < index; i++)
		str += ' ';
	
	str += '^';
	return str;
};

/* -----------------------------------------------------------------*/

Exceptions.SchyntaxParseError = function (message, input, index)
{
	this.input = input;
	this.index = index;
	this.message = message + "\n\n" + Exceptions.getPointerToIndex(input, index);
};

Util.inherits(Exceptions.SchyntaxParseError, Error);

/* -----------------------------------------------------------------*/

Exceptions.ValidTimeNotFoundError = function (schedule)
{
	this.schedule = schedule;
	this.message = "A valid time was not found for the schedule.";
};

Util.inherits(Exceptions.ValidTimeNotFoundError, Error);
