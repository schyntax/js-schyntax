"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Exceptions = require('./Exceptions');
var ExpressionType = require('./ExpressionType');
var Helpers = require('./Helpers');

/* =============================================================================
 * 
 * Validator
 *  
 * ========================================================================== */

module.exports = Validator;

/**
 * @param input {string}
 * @param program {Node.ProgramNode}
 * @constructor
 */
function Validator (input, program)
{
	/** @member {string} */
	this.input = input;
	/** @member {Node.ProgramNode} */
	this.program = program;
}

/* -------------------------------------------------------------------
 * Prototype Members
 * ---------------------------------------------------------------- */

Validator.prototype.assertValid = function ()
{
	this._assertProgram(this.program);
};

/**
 * @param program {Node.ProgramNode}
 */
Validator.prototype._assertProgram = function (program)
{
	var i;
	if (program.expressions.length === 0)
	{
		// no free-floating expressions, so we need to make sure there is at least one group with an expression
		var hasExpressions = false;
		for (i = 0; i < program.groups.length; i++)
		{
			if (program.groups[i].expressions.length > 0)
			{
				hasExpressions = true;
				break;
			}
		}

		if (!hasExpressions)
		{
			throw new Exceptions.InvalidScheduleError("Schedule must contain at least one expression.", this.input);
		}
	}

	for (i = 0; i < program.groups.length; i++)
	{
		this._group(program.groups[i]);
	}

	this._expressionList(program.expressions);
};

/**
 * @param group {Node.GroupNode}
 * @private
 */
Validator.prototype._group = function (group)
{
	this._expressionList(group.expressions);
};

/**
 * @param expressions {Node.ExpressionNode[]}
 * @private
 */
Validator.prototype._expressionList = function (expressions)
{
	for (var i = 0; i < expressions.length; i++)
	{
		this._expression(expressions[i]);
	}
};

/**
 * @param expression {Node.ExpressionNode}
 * @private
 */
Validator.prototype._expression = function (expression)
{
	if (expression.arguments.length === 0)
		throw new Exceptions.SchyntaxParseError("Expression has no arguments.", this.input, expression.index);

	for (var i = 0; i < expression.arguments.length; i++)
	{
		/** @type {Node.ArgumentNode} */
		var arg = expression.arguments[i];
		
		if (arg.hasInterval && arg.intervalValue === 0)
		{
			throw new Exceptions.SchyntaxParseError("\"%0\" is not a valid interval. If your intention was to include all " +
				expressionTypeToHumanString(expression.expressionType) +
				" use the wildcard operator \"*\" instead of an interval", this.input, arg.intervalTokenIndex);
		}

		var validator = this._getValidator(expression.expressionType);

		if (arg.isWildcard)
		{
			if (arg.isExclusion && !arg.hasInterval)
			{
				throw new Exceptions.SchyntaxParseError(
					"Wildcards can't be excluded with the ! operator, except when part of an interval (using %)",
					this.input, arg.index);
			}
		}
		else
		{
			if (arg.range === null || arg.range.start === null)
			{
				throw new Exceptions.SchyntaxParseError("Expected a value or range.", this.input, arg.index);
			}

			this._range(expression.expressionType, arg.range, validator);
		}

		if (arg.hasInterval)
		{
			validator.call(this, ExpressionType.IntervalValue, arg.interval);
		}
	}
};

/**
 * @param expressionType {number}
 * @return {function}
 * @private
 */
Validator.prototype._getValidator = function (expressionType)
{
	switch (expressionType)
	{
		case ExpressionType.Seconds:
		case ExpressionType.Minutes:
			return this._secondOrMinute;
		case ExpressionType.Hours:
			return this._hour;
		case ExpressionType.DaysOfWeek:
			return this._dayOfWeek;
		case ExpressionType.DaysOfMonth:
			return this._dayOfMonth;
		case ExpressionType.Dates:
			return this._date;
		default:
			throw new Error("ExpressionType " + expressionType + " has not been implemented by the validator." + Exceptions.PLEASE_REPORT_BUG_MSG);
	}
};

/**
 * @param expressionType {number}
 * @param range {Node.RangeNode}
 * @param validator {function}
 * @private
 */
Validator.prototype._range = function (expressionType, range, validator)
{
	validator.call(this, expressionType, range.start);
	if (range.end !== null)
	{
		validator.call(this, expressionType, range.end);

		if (range.isHalfOpen && this._valuesAreEqual(expressionType, range.start, range.end))
			throw new Exceptions.SchyntaxParseError("Start and end values of a half-open range cannot be equal.", this.input, range.start.index);
	}

	if (expressionType == ExpressionType.Dates && range.end !== null)
	{
		// special validation to make the date range is sane
		/** @type {Node.DateValueNode} */
		var start = range.start;
		/** @type {Node.DateValueNode} */
		var end = range.end;

		if (start.year !== null || end.year !== null)
		{
			if (start.year === null || end.year === null)
				throw new Exceptions.SchyntaxParseError("Cannot mix full and partial dates in a date range.", this.input, start.index);

			if (!this._isStartBeforeEnd(start, end))
				throw new Exceptions.SchyntaxParseError("End date of range is before the start date.", this.input, start.index);
		}
	}
};

/**
 * @param expressionType {number}
 * @param value {Node.IntegerValueNode}
 * @private
 */
Validator.prototype._secondOrMinute = function (expressionType, value)
{
	this._integerValue(expressionType, value, 0, 59);
};

/**
 * @param expressionType {number}
 * @param value {Node.IntegerValueNode}
 * @private
 */
Validator.prototype._hour = function (expressionType, value)
{
	this._integerValue(expressionType, value, 0, 23);
};

/**
 * @param expressionType {number}
 * @param value {Node.IntegerValueNode}
 * @private
 */
Validator.prototype._dayOfWeek = function (expressionType, value)
{
	this._integerValue(expressionType, value, 1, 7);
};

/**
 * @param expressionType {number}
 * @param value {Node.IntegerValueNode}
 * @private
 */
Validator.prototype._dayOfMonth = function (expressionType, value)
{
	var ival = this._integerValue(expressionType, value, -31, 31);
	if (ival === 0)
		throw new Exceptions.SchyntaxParseError("Day of month cannot be zero.", this.input, value.index);
};

/**
 * @param expressionType {number}
 * @param date {Node.DateValueNode}
 * @private
 */
Validator.prototype._date = function (expressionType, date)
{
	if (date.year !== null)
	{
		if (date.year < 1900 || date.year > 2200)
			throw new Exceptions.SchyntaxParseError("Year " + date.year + " is not a valid year. Must be between 1900 and 2200.", this.input, date.index);
	}

	if (date.month < 1 || date.month > 12)
	{
		throw new Exceptions.SchyntaxParseError("Month " + date.month + " is not a valid month. Must be between 1 and 12.", this.input, date.index);
	}

	var daysInMonth = Helpers.daysInMonth(date.year, date.month); // default to a leap year, if no year is specified
	if (date.day < 1 || date.day > daysInMonth)
	{
		throw new Exceptions.SchyntaxParseError(date.day + " is not a valid day for the month specified. Must be between 1 and " + daysInMonth, this.input, date.index);
	}
};

/**
 * @param expressionType {number}
 * @param value {Node.IntegerValueNode}
 * @param min {number}
 * @param max {number}
 * @return {number}
 * @private
 */
Validator.prototype._integerValue = function (expressionType, value, min, max)
{
	var ival = value.value;
	if (ival < min || ival > max)
	{
		var msg = expressionTypeToHumanString(expressionType) + ' cannot be ' + ival +
				'. Value must be between ' + min + ' and ' + max + '.';

		throw new Exceptions.SchyntaxParseError(msg, this.input, value.index);
	}

	return ival;
};

Validator.prototype._valuesAreEqual = function (expressionType, a, b)
{
	if (expressionType == ExpressionType.Dates)
	{
		/** @type {Node.DateValueNode} */
		var ad = a;
		/** @type {Node.DateValueNode} */
		var bd = b;

		if (ad.day != bd.day || ad.month != bd.month)
			return false;

		if (ad.year !== null && ad.year != bd.year)
			return false;

		return true;
	}

	// integer values
	var ai = a.value;
	var bi = b.value;

	return ai == bi;
};

/**
 * @param start {Node.DateValueNode}
 * @param end {Node.DateValueNode}
 * @return {boolean}
 * @private
 */
Validator.prototype._isStartBeforeEnd = function (start, end)
{
	if (start.year < end.year)
		return true;

	if (start.year > end.year)
		return false;

	// must be the same start and end year if we get here

	if (start.month < end.month)
		return true;

	if (start.month > end.month)
		return false;

	// must be the same month

	return start.day <= end.day;
};

function expressionTypeToHumanString (expressionType)
{
	switch (expressionType)
	{
		case ExpressionType.DaysOfMonth:
			return "days of the month";
		case ExpressionType.DaysOfWeek:
			return "days of the week";
		case ExpressionType.IntervalValue:
			return "interval";
		default:
			return ExpressionType.valueToName(expressionType);
	}
}
