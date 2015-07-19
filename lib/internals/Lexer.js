"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Exceptions = require('./Exceptions');
var Terms = require('./Terms');
var Token = require('./Token');
var TokenType = require('./TokenType');

/* =============================================================================
 * 
 * Lexer
 *  
 * ========================================================================== */

var ContextMode = {
	Program: 0,
	Group: 1,
	Expression: 2,
};

module.exports = Lexer;

/**
 * @param input {string}
 * @constructor
 */
function Lexer (input)
{
	// LexerBase init
	this.input = input;
	this._length = input.length;
	
	// LexerBase defaults
	this._index = 0;
	this._leadingTrivia = '';
	/** @member {number[]} from ContextMode enum. */
	this._contextStack = [];
	/** @member {Token[]} */
	this._tokenQueue = [];
	
	this._enterContext(ContextMode.Program);
	
	// Lexer init
	/** @member {function} */
	this._lexMethod = this._lexList;
}

/* -------------------------------------------------------------------
 * LexerBase Members
 * ---------------------------------------------------------------- */

Object.defineProperty(Lexer.prototype, '_context', {
	get: function () { return this._contextStack[this._contextStack.length - 1]; }
});

/**
 * @return {Token}
 */
Lexer.prototype.advance = function ()
{
	if (this._tokenQueue.length === 0)
		this._queueNext();
	
	return this._tokenQueue.shift();
};

/**
 * @return {Token}
 */
Lexer.prototype.peek = function ()
{
	if (this._tokenQueue.length === 0)
		this._queueNext();
	
	return this._tokenQueue[0];
};
	
Lexer.prototype._queueNext = function ()
{
	while (this._tokenQueue.length === 0)
	{
		this._consumeWhiteSpace();
		this._lexMethod = this._lexMethod.call(this);
	}
};

Lexer.prototype._enterContext = function (context)
{
	this._contextStack.push(context);
};

Lexer.prototype._exitContext = function ()
{
	if (this._contextStack.length === 1)
		throw new Error("The lexer attempted to exit the last context." + Exceptions.PLEASE_REPORT_BUG_MSG);
	
	return this._contextStack.pop();
};

Object.defineProperty(Lexer.prototype, '_isEndNext', {
	get: function () { return this._index == this._length; }
});

Object.defineProperty(Lexer.prototype, '_isWhiteSpaceNext', {
	get: function ()
	{
		switch (this.input[this._index])
		{
			case ' ':
			case '\t':
			case '\n':
			case '\r':
				return true;
			default:
				return false;
		}
	}
});

/**
 * @return {boolean}
 */
Lexer.prototype._endOfInput = function ()
{
	this._consumeWhiteSpace();
	if (this._isEndNext)
	{
		if (this._contextStack.length > 1)
			throw new Error("Lexer reached the end of the input while in a nested context." + Exceptions.PLEASE_REPORT_BUG_MSG);
		
		var tok = new Token();
		tok.type = TokenType.EndOfInput;
		tok.index = this._index;
		tok.rawValue = '';
		tok.value = '';
		
		this._consumeToken(tok);
		return true;
	}
	
	return false;
};

Lexer.prototype._consumeWhiteSpace = function ()
{
	var start = this._index;
	while (!this._isEndNext && this._isWhiteSpaceNext)
		this._index++;
	
	this._leadingTrivia += this.input.substr(start, this._index - start);
};

/**
 * @param term {Terminal}
 * @return {boolean}
 */
Lexer.prototype._isNextTerm = function (term)
{
	this._consumeWhiteSpace();
	return term.getToken(this.input, this._index) !== null;
};

/**
 * @param term {Terminal}
 * @private
 */
Lexer.prototype._consumeTerm = function (term)
{
	this._consumeWhiteSpace();
	
	var tok = term.getToken(this.input, this._index);
	if (tok === null)
		throw this._unexpectedText(term.tokenType);
	
	this._consumeToken(tok);
};

/**
 * @param term {Terminal}
 * @return {boolean}
 * @private
 */
Lexer.prototype._consumeOptionalTerm = function (term)
{
	this._consumeWhiteSpace();

	var tok = term.getToken(this.input, this._index);
	if (tok === null)
		return false;
	
	this._consumeToken(tok);
	return true;
};

/**
 * 
 * @param tok {Token}
 * @private
 */
Lexer.prototype._consumeToken = function (tok)
{
	this._index += tok.rawValue.length;
	tok.leadingTrivia = this._leadingTrivia;
	this._leadingTrivia = '';
	this._tokenQueue.push(tok);
};

/**
 * 
 * @return {exports.SchyntaxParseError}
 * @private
 */
Lexer.prototype._unexpectedText = function ()
{
	var expected = '';
	for (var i = 0; i < arguments.length; i++)
	{
		if (i > 0)
			expected += ', ';
		
		expected += TokenType.valueToName(arguments[i]);
	}
	
	var msg = "Unexpected input at index " + this._index + ". Was expecting " + expected;
	return new Exceptions.SchyntaxParseError(msg, this.input, this._index);
};

/* -------------------------------------------------------------------
 * Lexer Members
 * ---------------------------------------------------------------- */

Lexer.prototype._lexPastEndOfInput = function ()
{
	throw new Error("Lexer was advanced past the end of the input." + Exceptions.PLEASE_REPORT_BUG_MSG);
};

Lexer.prototype._lexList = function ()
{
	this._consumeOptionalTerm(Terms.Comma);
	
	if (this._endOfInput())
		return this._lexPastEndOfInput;
	
	if (this._context === ContextMode.Program)
	{
		if (this._isNextTerm(Terms.OpenCurly))
			return this._lexGroup;
	}
	else if (this._context === ContextMode.Group)
	{
		if (this._consumeOptionalTerm(Terms.CloseCurly))
		{
			this._exitContext();
			return this._lexList;
		}
	}
	else if (this._context === ContextMode.Expression)
	{
		if (this._consumeOptionalTerm(Terms.CloseParen))
		{
			this._exitContext();
			return this._lexList;
		}
	}
	
	if (this._context == ContextMode.Expression)
		return this._lexExpressionArgument;
	
	return this._lexExpression;
};

Lexer.prototype._lexGroup = function ()
{
	this._consumeTerm(Terms.OpenCurly);
	this._enterContext(ContextMode.Group);
	return this._lexList;
};

Lexer.prototype._lexExpression = function ()
{
	if (this._consumeOptionalTerm(Terms.Seconds) ||
		this._consumeOptionalTerm(Terms.Minutes) ||
		this._consumeOptionalTerm(Terms.Hours) ||
		this._consumeOptionalTerm(Terms.DaysOfWeek) ||
		this._consumeOptionalTerm(Terms.DaysOfMonth) ||
		this._consumeOptionalTerm(Terms.Dates))
	{
		this._consumeTerm(Terms.OpenParen);
		this._enterContext(ContextMode.Expression);

		return this._lexList;
	}

	throw this._unexpectedText(TokenType.ExpressionName);
};

Lexer.prototype._lexExpressionArgument = function ()
{
	this._consumeOptionalTerm(Terms.Not);
	
	if (!this._consumeOptionalTerm(Terms.Wildcard))
	{
		if (this._consumeNumberDayOrDate(false))
		{
			// might be a range
			if (this._consumeOptionalTerm(Terms.RangeHalfOpen) || this._consumeOptionalTerm(Terms.RangeInclusive))
				this._consumeNumberDayOrDate(true);
		}
	}
	
	if (this._consumeOptionalTerm(Terms.Interval))
		this._consumeTerm(Terms.PositiveInteger);
	
	return this._lexList;
};

/**
 * @param required {boolean}
 * @return {boolean}
 * @private
 */
Lexer.prototype._consumeNumberDayOrDate = function (required)
{
	if (this._consumeOptionalTerm(Terms.PositiveInteger))
	{
		// this might be a date - check for slashes
		if (this._consumeOptionalTerm(Terms.ForwardSlash))
		{
			this._consumeTerm(Terms.PositiveInteger);

			// might have a year... one more check
			if (this._consumeOptionalTerm(Terms.ForwardSlash))
				this._consumeTerm(Terms.PositiveInteger);
		}

		return true;
	}

	if (this._consumeOptionalTerm(Terms.NegativeInteger) ||
		this._consumeOptionalTerm(Terms.Sunday) ||
		this._consumeOptionalTerm(Terms.Monday) ||
		this._consumeOptionalTerm(Terms.Tuesday) ||
		this._consumeOptionalTerm(Terms.Wednesday) ||
		this._consumeOptionalTerm(Terms.Thursday) ||
		this._consumeOptionalTerm(Terms.Friday) ||
		this._consumeOptionalTerm(Terms.Saturday))
	{
		return true;
	}

	if (required)
		throw this._unexpectedText(TokenType.PositiveInteger, TokenType.NegativeInteger, TokenType.DayLiteral);

	return false;
};
