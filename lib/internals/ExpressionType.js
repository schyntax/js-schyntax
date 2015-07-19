"use strict";

var Exceptions = require('./Exceptions');

// setup enum
var i = 0;
var ExpressionType = {
	
	IntervalValue: i++, // used internally by the parser (not a real expression type)
	Seconds: i++,
	Minutes: i++,
	Hours: i++,
	DaysOfWeek: i++,
	DaysOfMonth: i++,
	Dates: i++,
};

Object.defineProperty(ExpressionType, 'valueToName', {
	value: function (value)
	{
		for (var name in ExpressionType)
		{
			if (ExpressionType[name] === value)
				return name;
		}

		throw new Error('Invalid TokenType: ' + value + Exceptions.PLEASE_REPORT_BUG_MSG);
	}
});

Object.defineProperty(ExpressionType, 'nameToValue', {
	value: function (name)
	{
		var value = ExpressionType[name];
		
		if (typeof value !== 'number')
			throw new Error('Invalid TokenType name: ' + name + Exceptions.PLEASE_REPORT_BUG_MSG);
		
		return value;
	}
});

module.exports = ExpressionType;
