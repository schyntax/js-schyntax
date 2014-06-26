"use strict";

var assert = require('assert');
var sch = require('..');

suite('Formats', function ()
{
	test('Empty throws error', function ()
	{
		try { sch(''); assert(false); } catch (ex) {}
		try { sch('dates()'); assert(false); } catch (ex) {}
		try { sch('schedule()'); assert(false); } catch (ex) {}
		try { sch('schedule(dates())'); assert(false); } catch (ex) {}
	});
	
	test('minutes', function ()
	{
		/** @type {Schedule} */
		var s;
		var d, next, prev;

		d = new Date('2014-06-25T18:26:12.326Z');
		prev = new Date('2014-06-25T18:26:00Z');
		next = new Date('2014-06-25T18:27:00Z');
		
		s = sch('m()');
		assert(prev.getTime() === s.previous(d).getTime());
		assert(next.getTime() === s.next(d).getTime());
		
		s = sch('min()');
		assert(prev.getTime() === s.previous(d).getTime());
		assert(next.getTime() === s.next(d).getTime());
		
		s = sch('minute()');
		assert(prev.getTime() === s.previous(d).getTime());
		assert(next.getTime() === s.next(d).getTime());
		
		s = sch('minutes()');
		assert(prev.getTime() === s.previous(d).getTime());
		assert(next.getTime() === s.next(d).getTime());
		
		s = sch('minuteofhour()');
		assert(prev.getTime() === s.previous(d).getTime());
		assert(next.getTime() === s.next(d).getTime());
		
		s = sch('minutesofhour()');
		assert(prev.getTime() === s.previous(d).getTime());
		assert(next.getTime() === s.next(d).getTime());
		
		s = sch('m(0-59)');
		assert(prev.getTime() === s.previous(d).getTime());
		assert(next.getTime() === s.next(d).getTime());
		
		s = sch('m(12-26, 27)');
		assert(prev.getTime() === s.previous(d).getTime());
		assert(next.getTime() === s.next(d).getTime());
		
		s = sch('m(12-28)');
		assert(prev.getTime() === s.previous(d).getTime());
		assert(next.getTime() === s.next(d).getTime());
		
		s = sch('m(!12-28)');
		prev = new Date('2014-06-25T18:11:00Z');
		next = new Date('2014-06-25T18:29:00Z');
		assert(prev.getTime() === s.previous(d).getTime());
		assert(next.getTime() === s.next(d).getTime());
		
		s = sch('m(!12-28, 26, 27)');
		prev = new Date('2014-06-25T18:11:00Z');
		next = new Date('2014-06-25T18:29:00Z');
		assert(s.previous(d) === null);
		assert(s.next(d) === null);
		
	});
	
	//TODO: lots more tests...
});