"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var ScheduleBuilder = require('./ScheduleBuilder');

/* =============================================================================
 * 
 * Schedule Class
 * 
 * Defines a schedule for a scheduled task. 
 *  
 * ========================================================================== */

module.exports = Schedule;

function Schedule (text)
{
	if (typeof text !== 'string')
		throw new Error('must pass a string argument to sch');

	/* -------------------------------------------------------------------
	 * Private Members Declaration << no methods >>
	 * ---------------------------------------------------------------- */
	
	/**
	 * @member {RuleGroup[]}
	 * @private
	 */
	Object.defineProperty(this, 'ruleGroups', { value: [], writable: true });
	
	// parse text into rules
	var sb = new ScheduleBuilder(text);

	// parse input string
	sb.tokenize();
	sb.buildAbstractSyntaxTree();

	// compile into rule groups
	this.ruleGroups = sb.compile();
	
	if (this.ruleGroups.length === 0)
		throw new SyntaxError('No rules were defined.');
}

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

/**
 * @param [atOrBefore] {Date}
 */
Schedule.prototype.previous = function (atOrBefore)
{
	if (typeof atOrBefore === 'number')
	{
		atOrBefore = new Date(atOrBefore);
	}
	else if (!atOrBefore)
	{
		atOrBefore = new Date();
	}

	if (!(atOrBefore instanceof Date) || isNaN(atOrBefore))
	{
		throw new Error('"before" must be a valid Date.');
	}

	var rules, event;
	var prevEvent = null;
	for (var i = 0; i < this.ruleGroups.length; i++)
	{
		rules = this.ruleGroups[i];
		event = rules.getEvent(atOrBefore, false);
		if (event)
		{
			if (!prevEvent || event > prevEvent)
				prevEvent = event;
		}
	}

	return prevEvent;
};

/**
 * @param [after] {Date}
 */
Schedule.prototype.next = function (after)
{
	if (typeof after === 'number')
	{
		after = new Date(after);
	}
	else if (!after)
	{
		after = new Date();
	}

	if (!(after instanceof Date) || isNaN(after))
	{
		throw new Error('"after" must be a valid Date.');
	}
	
	var rules, event;
	var nextEvent = null;
	for (var i = 0; i < this.ruleGroups.length; i++)
	{
		rules = this.ruleGroups[i];
		event = rules.getEvent(after, true);
		if (event)
		{
			if (!nextEvent || event < nextEvent)
				nextEvent = event;
		}
	}
	
	return nextEvent;
};



