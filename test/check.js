"use strict";

var assert = require('assert');
var sch = require('..');

module.exports = check;

function check (format, d, prev, next)
{
	var s = sch(format);
	
	var actualPrev = s.previous(d);
	var actualNext = s.next(d);
	
	if (prev === null)
	{
		assert(actualPrev === null, 'Previous date was expected to be null. It was ' + actualPrev);
	}
	else
	{
		assert(prev.getTime() === actualPrev.getTime(), 'Previous time was ' + actualPrev.toUTCString() + '. Expected: ' + prev.toUTCString());
	}
	
	if (next === null)
	{
		assert(actualNext === null, 'Next date was expected to be null. It was ' + actualNext);
	}
	else
	{
		assert(next.getTime() === actualNext.getTime(), 'Next time was ' + actualNext.toUTCString() + '. Expected: ' + next.toUTCString());
	}
}
