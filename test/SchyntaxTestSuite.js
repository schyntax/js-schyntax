"use strict";

var assert = require('assert');
var Exceptions = require('../lib/internals/Exceptions');
var Schedule = require('../lib/Schedule');
var testsJson = require('./tests.json');

for (var suiteName in testsJson)
{
	suite(suiteName, testRunner);
}

function testRunner ()
{
	var tests = testsJson[this.title].checks;
	
	for (var i = 0; i < tests.length; i++)
	{
		createTest(tests[i]);
	}
}

function createTest (info)
{
	test(info.format, function ()
	{
		var start = new Date(info.date);
		var prev = info.prev ? new Date(info.prev) : null;
		var next = info.next ? new Date(info.next) : null;
		var errorIndex = typeof info.parseErrorIndex === 'number' ? info.parseErrorIndex : null;
		
		var sch;
		
		try
		{
			sch = new Schedule(info.format);

			if (errorIndex !== null)
				throw new Error('Expected a parse error at index ' + errorIndex + ', but no error was thrown.');
		}
		catch (ex)
		{
			if (errorIndex !== null && ex instanceof Exceptions.SchyntaxParseError)
			{
				if (ex.index === errorIndex)
					return;
				
				throw new Error('Wrong parse error index. Expected: ' + errorIndex + '. Actual: ' + ex.index + '\n' + ex.message);
			}
			
			throw ex;
		}
		
		try
		{
			var actualPrev = sch.previous(start);
			if (prev === null)
				throw new Error('Expected a ValidTimeNotFoundException. Date returned from previous: ' + actualPrev);
			
			assert(prev.getTime() === actualPrev.getTime(), 'Previous time was ' + actualPrev.toUTCString() + '. Expected: ' + prev.toUTCString());
		}
		catch (ex)
		{
			if (!(ex instanceof Exceptions.ValidTimeNotFoundError) || prev !== null)
				throw ex;
		}
		
		try
		{
			var actualNext = sch.next(start);
			if (next === null)
				throw new Error('Expected a ValidTimeNotFoundException. Date returned from next: ' + actualNext);
			
			assert(next.getTime() === actualNext.getTime(), 'Next time was ' + actualNext.toUTCString() + '. Expected: ' + next.toUTCString());
		}
		catch (ex)
		{
			if (!(ex instanceof Exceptions.ValidTimeNotFoundError) || next !== null)
				throw ex;
		}
	});
}