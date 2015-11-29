"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Exceptions = require('./Exceptions');
var ExpressionType = require('./ExpressionType');
var Token = require('./Token');
var TokenType = require('./TokenType');

/* =============================================================================
 * 
 * Terms
 *  
 * ========================================================================== */

var Terms = {
	
	// literal terminals
	RangeInclusive: new Terminal(TokenType.RangeInclusive, '..'),
	RangeHalfOpen: new Terminal(TokenType.RangeHalfOpen, '..<'),
	Interval: new Terminal(TokenType.Interval, '%'),
	Not: new Terminal(TokenType.Not, '!'),
	OpenParen: new Terminal(TokenType.OpenParen, '('),
	CloseParen: new Terminal(TokenType.CloseParen, ')'),
	OpenCurly: new Terminal(TokenType.OpenCurly, '{'),
	CloseCurly: new Terminal(TokenType.CloseCurly, '}'),
	ForwardSlash: new Terminal(TokenType.ForwardSlash, '/'),
	Comma: new Terminal(TokenType.Comma, ','),
	Wildcard: new Terminal(TokenType.Wildcard, '*'),
	
	// regex terminals
	PositiveInteger: new Terminal(TokenType.PositiveInteger, null, /^[0-9]+/i),
	NegativeInteger: new Terminal(TokenType.NegativeInteger, null, /^-[0-9]+/i),

	Sunday: new Terminal(TokenType.DayLiteral, "SUNDAY", /^(su|sun|sunday)(?:\b)/i),
	Monday: new Terminal(TokenType.DayLiteral, "MONDAY", /^(mo|mon|monday)(?:\b)/i),
	Tuesday: new Terminal(TokenType.DayLiteral, "TUESDAY", /^(tu|tue|tuesday|tues)(?:\b)/i),
	Wednesday: new Terminal(TokenType.DayLiteral, "WEDNESDAY", /^(we|wed|wednesday)(?:\b)/i),
	Thursday: new Terminal(TokenType.DayLiteral, "THURSDAY", /^(th|thu|thursday|thur|thurs)(?:\b)/i),
	Friday: new Terminal(TokenType.DayLiteral, "FRIDAY", /^(fr|fri|friday)(?:\b)/i),
	Saturday: new Terminal(TokenType.DayLiteral, "SATURDAY", /^(sa|sat|saturday)(?:\b)/i),

	Seconds: fromExpressionType(ExpressionType.Seconds,/^(s|sec|second|seconds|secondofminute|secondsofminute)(?:\b)/i),
	Minutes: fromExpressionType(ExpressionType.Minutes,/^(m|min|minute|minutes|minuteofhour|minutesofhour)(?:\b)/i),
	Hours: fromExpressionType(ExpressionType.Hours,/^(h|hour|hours|hourofday|hoursofday)(?:\b)/i),
	DaysOfWeek: fromExpressionType(ExpressionType.DaysOfWeek,/^(day|days|dow|dayofweek|daysofweek)(?:\b)/i),
	DaysOfMonth: fromExpressionType(ExpressionType.DaysOfMonth,/^(dom|dayofmonth|daysofmonth)(?:\b)/i),
	DaysOfYear: fromExpressionType(ExpressionType.DaysOfYear,/^(doy|dayofyear|daysofyear)(?:\b)/i),
	Dates: fromExpressionType(ExpressionType.Dates,/^(date|dates)(?:\b)/i),
};

module.exports = Terms;

/* =============================================================================
 * 
 * Terminal - Internal class
 *  
 * ========================================================================== */

/**
 * 
 * @param tokenType {number} From the TokenType enum.
 * @param value {string}
 * @param [regex] {RegExp}
 * @constructor
 */
function Terminal (tokenType, value, regex)
{
	this.tokenType = tokenType;
	this.value = value;
	this.regex = regex;
}

/* -------------------------------------------------------------------
 * Static Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

/**
 * 
 * @param expressionType {number} From the ExpressionType enum.
 * @param regex {RegExp}
 * @return {Terminal}
 */
function fromExpressionType (expressionType, regex)
{
	var expTypeName = ExpressionType.valueToName(expressionType);
	return new Terminal(TokenType.ExpressionName, expTypeName, regex);
}

/* -------------------------------------------------------------------
 * Prototype Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

/**
 * 
 * @param input {string}
 * @param index {number}
 * @return {Token}
 */
Terminal.prototype.getToken = function (input, index)
{
	if (!this.regex)
	{
		if (input.length - index < this.value.length)
			return null;
		
		for (var i = 0; i < this.value.length; i++)
		{
			if (input[index + i] !== this.value[i])
				return null;
		}
		
		return this.createToken(index, this.value);
	}
	
	var match = this.regex.exec(input.substr(index));
	if (!match)
		return null;
	
	return this.createToken(index, match[0], match[0]);
};

/**
 * 
 * @param index {number}
 * @param raw {string}
 * @param [value] {string}
 * @return {Token}
 */
Terminal.prototype.createToken = function (index, raw, value)
{
	var token = new Token();
	token.type = this.tokenType;
	token.index = index;
	token.rawValue = raw;
	token.value = this.value || value;
	
	return token;
};
