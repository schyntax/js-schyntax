"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Exceptions = require('./Exceptions');
var ExpressionType = require('./ExpressionType');
var Lexer = require('./Lexer');
var Node = require('./Node');
var TokenType = require('./TokenType');

/* =============================================================================
 * 
 * Parser
 *  
 * ========================================================================== */

module.exports = Parser;

/**
 * @param input {string}
 * @constructor
 */
function Parser (input)
{
	// ParserBase init
	this._lexer = new Lexer(input);
}

/* -------------------------------------------------------------------
 * ParserBase Members
 * ---------------------------------------------------------------- */

Object.defineProperty(Parser.prototype, 'input', {
	get: function () { return this._lexer.input; }
});

/**
 * @return {Token}
 * @private
 */
Parser.prototype._peek = function ()
{
	return this._lexer.peek();
};

/**
 * @return {Token}
 * @private
 */
Parser.prototype._advance = function ()
{
	return this._lexer.advance();
};

/**
 * @param tokenType {number} From TokenType enum.
 * @return {Token}
 * @private
 */
Parser.prototype._expect = function (tokenType)
{
	if (!this._isNext(tokenType))
		throw this._wrongTokenException(tokenType);
	
	return this._advance();
};

/**
 * @param tokenType {number} From TokenType enum.
 * @return {boolean}
 * @private
 */
Parser.prototype._isNext = function (tokenType)
{
	return this._peek().type == tokenType;
};

Parser.prototype._wrongTokenException = function ()
{
	var expected = '';
	for (var i = 0; i < arguments.length; i++)
	{
		if (i > 0)
			expected += ', ';

		expected += TokenType.valueToName(arguments[i]);
	}
	
	var next = this._peek();
	var msg = "Unexpected token type " + TokenType.valueToName(next.type) + " at index " + this._index + ". Was expecting " + expected;
	return new Exceptions.SchyntaxParseError(msg, this.input, this._index);
};

/* -------------------------------------------------------------------
 * Parser Members
 * ---------------------------------------------------------------- */

/**
 * @return {Node.ProgramNode}
 */
Parser.prototype.parse = function ()
{
	return this._parseProgram();
};

/**
 * @return {Node.ProgramNode}
 */
Parser.prototype._parseProgram = function ()
{
	var program = new Node.ProgramNode();
	
	while (!this._isNext(TokenType.EndOfInput))
	{
		if (this._isNext(TokenType.OpenCurly))
		{
			program.addGroup(this._parseGroup());
		}
		else if (this._isNext(TokenType.ExpressionName))
		{
			program.addExpression(this._parseExpression());
		}
		else
		{
			throw this._wrongTokenException(TokenType.OpenCurly, TokenType.ExpressionName, TokenType.Comma);
		}

		if (this._isNext(TokenType.Comma)) // optional comma
		{
			program.addToken(this._advance());
		}
	}

	program.addToken(this._expect(TokenType.EndOfInput));
	return program;
};

/**
 * @return {Node.GroupNode}
 */
Parser.prototype._parseGroup = function ()
{
	var group = new Node.GroupNode();
	group.addToken(this._expect(TokenType.OpenCurly));

	while (!this._isNext(TokenType.CloseCurly))
	{
		group.addExpression(this._parseExpression());

		if (this._isNext(TokenType.Comma)) // optional comma
		{
			group.addToken(this._advance());
		}
	}

	group.addToken(this._expect(TokenType.CloseCurly));
	return group;
};

/**
 * @return {Node.ExpressionNode}
 */
Parser.prototype._parseExpression = function ()
{
	var nameTok = this._expect(TokenType.ExpressionName);
	var type = ExpressionType.nameToValue(nameTok.value);
	var exp = new Node.ExpressionNode(type);
	exp.addToken(this._expect(TokenType.OpenParen));

	while (true)
	{
		exp.addArgument(this._parseArgument(type));

		if (this._isNext(TokenType.CloseParen))
		{
			break;
		}

		if (this._isNext(TokenType.Comma)) // optional comma
		{
			exp.addToken(this._advance());
		}
	}

	exp.addToken(this._expect(TokenType.CloseParen));
	return exp;
};

/**
 * @return {Node.ArgumentNode}
 */
Parser.prototype._parseArgument = function (expressionType)
{
	var arg = new Node.ArgumentNode();

	if (this._isNext(TokenType.Not))
	{
		arg.isExclusion = true;
		arg.addToken(this._advance());
	}

	if (this._isNext(TokenType.Wildcard))
	{
		arg.isWildcard = true;
		arg.addToken(this._advance());
	}
	else
	{
		arg.range = this._parseRange(expressionType);
	}

	if (this._isNext(TokenType.Interval))
	{
		arg.addToken(this._advance());
		arg.interval = this._parseIntegerValue(ExpressionType.IntervalValue);
	}

	return arg;
};

/**
 * @return {Node.RangeNode}
 */
Parser.prototype._parseRange = function (expressionType)
{
	var range = new Node.RangeNode();
	range.start = expressionType == ExpressionType.Dates ? this._parseDate() : this._parseIntegerValue(expressionType);

	var isRange = false;
	if (this._isNext(TokenType.RangeInclusive))
	{
		isRange = true;
	}
	else if (this._isNext(TokenType.RangeHalfOpen))
	{
		isRange = true;
		range.isHalfOpen = true;
	}

	if (isRange)
	{
		range.addToken(this._advance());
		range.end = expressionType == ExpressionType.Dates ? this._parseDate() : this._parseIntegerValue(expressionType);
	}

	return range;
};

/**
 * @return {Node.IntegerValueNode}
 */
Parser.prototype._parseIntegerValue = function (expressionType)
{
	var val = new Node.IntegerValueNode();

	/** @type {Token} */
	var tok;
	if (this._isNext(TokenType.PositiveInteger))
	{
		// positive integer is valid for anything
		tok = this._advance();
		val.addToken(tok);
		val.value = Number(tok.value);
	}
	else if (this._isNext(TokenType.NegativeInteger))
	{
		if (expressionType != ExpressionType.DaysOfMonth)
		{
			throw new Exceptions.SchyntaxParseError("Negative values are only allowed in dayofmonth expressions.", this.input, this._peek().index);
		}

		tok = this._advance();
		val.addToken(tok);
		val.value = Number(tok.value);
	}
	else if (this._isNext(TokenType.DayLiteral))
	{
		tok = this._advance();
		val.addToken(tok);
		val.value = dayToInteger(tok.value);
	}
	else
	{
		switch (expressionType)
		{
			case ExpressionType.DaysOfMonth:
				throw this._wrongTokenException(TokenType.PositiveInteger, TokenType.NegativeInteger);
			case ExpressionType.DaysOfWeek:
				throw this._wrongTokenException(TokenType.PositiveInteger, TokenType.DayLiteral);
			default:
				throw this._wrongTokenException(TokenType.PositiveInteger);
		}
	}

	return val;
};

/**
 * @return {Node.DateValueNode}
 */
Parser.prototype._parseDate = function ()
{
	var date = new Node.DateValueNode();

	var tok = this._expect(TokenType.PositiveInteger);
	date.addToken(tok);
	var one = Number(tok.value);

	date.addToken(this._expect(TokenType.ForwardSlash));

	tok = this._expect(TokenType.PositiveInteger);
	date.addToken(tok);
	var two = Number(tok.value);

	var three = -1;
	if (this._isNext(TokenType.ForwardSlash))
	{
		date.addToken(this._expect(TokenType.ForwardSlash));

		tok = this._expect(TokenType.PositiveInteger);
		date.addToken(tok);
		three = Number(tok.value);
	}

	if (three != -1)
	{
		// date has a year
		date.year = one;
		date.month = two;
		date.day = three;
	}
	else
	{
		// no year
		date.month = one;
		date.day = two;
	}

	return date;
};

function dayToInteger (day)
{
	switch (day)
	{
		case "SUNDAY":
			return 1;
		case "MONDAY":
			return 2;
		case "TUESDAY":
			return 3;
		case "WEDNESDAY":
			return 4;
		case "THURSDAY":
			return 5;
		case "FRIDAY":
			return 6;
		case "SATURDAY":
			return 7;
		default:
			throw new Error(day + " is not a day");
	}
}
