"use strict";

var assert = require('assert');
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
		var prev = new Date(info.prev);
		var next = new Date(info.next);
		
		var sch = new Schedule(info.format);
		
		var actualPrev = sch.previous(start);
		var actualNext = sch.next(start);

		assert(prev.getTime() === actualPrev.getTime(), 'Previous time was ' + actualPrev.toUTCString() + '. Expected: ' + prev.toUTCString());
		assert(next.getTime() === actualNext.getTime(), 'Next time was ' + actualNext.toUTCString() + '. Expected: ' + next.toUTCString());
	});
}