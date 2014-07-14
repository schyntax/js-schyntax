"use strict";

var assert = require('assert');
var sch = require('..');

suite('Empty', function ()
{
	test('Empty throws error', function ()
	{
		try
		{
			sch('');
		}
		catch (ex)
		{
			return;
		}
		
		assert(false);
	});
	
	test('Empty group throws error', function ()
	{
		try
		{
			sch('group()');
		}
		catch (ex)
		{
			return;
		}
		
		assert(false);
	});
	
	test('Impossible schedule', function ()
	{
		var s = sch('m(!12-28, 26, 27)');
		var d = new Date('2014-06-25T18:26:12.326Z');
		assert(s.previous(d) === null);
		assert(s.next(d) === null);
		
	});
});