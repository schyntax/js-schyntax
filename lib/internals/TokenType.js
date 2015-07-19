"use strict";

var Exceptions = require('./Exceptions');

// setup enum
var i = 0;
var TokenType = {
	
	// meta
	None: i++,
	EndOfInput: i++,
	
	// operators
	RangeInclusive: i++,
	RangeHalfOpen: i++,
	Interval: i++,
	Not: i++,
	OpenParen: i++,
	CloseParen: i++,
	OpenCurly: i++,
	CloseCurly: i++,
	ForwardSlash: i++,
	Comma: i++,
	Wildcard: i++,

	// alpha-numeric
	PositiveInteger: i++,
	NegativeInteger: i++,
	ExpressionName: i++,
	DayLiteral: i++,
};

Object.defineProperty(TokenType, 'valueToName',{
	value: function (value)
	{
		for (var name in TokenType)
		{
			if (TokenType[name] === value)
				return name;
		}
		
		throw new Error('Invalid TokenType: ' + value + Exceptions.PLEASE_REPORT_BUG_MSG);
	}
});

module.exports = TokenType;
