"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Exceptions = require('./Exceptions');
var ExpressionType = require('./ExpressionType');
var Ir = require('./Ir');

/* =============================================================================
 * 
 * IrBuilder
 *  
 * ========================================================================== */

var IrBuilder = {};
module.exports = IrBuilder;

/**
 * @param program {Node.ProgramNode}
 * @return {Ir.Program}
 */
IrBuilder.compileAst = function (program)
{
	var ir = new Ir.Program();

	// free-floating expressions are placed in an implicit group
	var irGroup = compileGroup(program.expressions);
	if (irGroup !== null)
		ir.groups.push(irGroup);

	// compile all groups
	for (var i = 0; i < program.groups.length; i++)
	{
		irGroup = compileGroup(program.groups[i].expressions);
		if (irGroup !== null)
			ir.groups.push(irGroup);
	}
	
	return ir;
};

/**
 * @param expressions {Node.ExpressionNode[]}
 * @return {Ir.Group}
 * @private
 */
function compileGroup (expressions)
{
	if (expressions === null || expressions.length === 0)
		return null;

	var irGroup = new Ir.Group();

	for (var i = 0; i < expressions.length; i++)
	{
		compileExpression(irGroup, expressions[i]);
	}

	// setup implied rules
	if (irGroup.hasSeconds || irGroup.hasSecondsExcluded)
	{
		// don't need to setup any defaults if seconds are defined
	}
	else if (irGroup.hasMinutes || irGroup.hasMinutesExcluded)
	{
		irGroup.seconds.push(getZeroInteger());
	}
	else if (irGroup.hasHours || irGroup.hasHoursExcluded)
	{
		irGroup.seconds.push(getZeroInteger());
		irGroup.minutes.push(getZeroInteger());
	}
	else // only a date level expression was set
	{
		irGroup.seconds.push(getZeroInteger());
		irGroup.minutes.push(getZeroInteger());
		irGroup.hours.push(getZeroInteger());
	}

	return irGroup;
}

/**
 * @param irGroup {Ir.Group}
 * @param expression {Node.ExpressionNode}
 * @private
 */
function compileExpression (irGroup, expression)
{
	for (var i = 0; i < expression.arguments.length; i++)
	{
		var arg = expression.arguments[i];

		switch (expression.expressionType)
		{
			case ExpressionType.Seconds:
				compileSecondsArgument(irGroup, arg);
				break;
			case ExpressionType.Minutes:
				compileMinutesArgument(irGroup, arg);
				break;
			case ExpressionType.Hours:
				compileHoursArgument(irGroup, arg);
				break;
			case ExpressionType.DaysOfWeek:
				compileDaysOfWeekArgument(irGroup, arg);
				break;
			case ExpressionType.DaysOfMonth:
				compileDaysOfMonthArgument(irGroup, arg);
				break;
			case ExpressionType.DaysOfYear:
				compileDaysOfYearArgument(irGroup, arg);
				break;
			case ExpressionType.Dates:
				compileDateArgument(irGroup, arg);
				break;
			default:
				var expName = ExpressionType.valueToName(expression.expressionType);
				throw new Error("Expression type " + expName + " not supported by the schyntax compiler." + Exceptions.PLEASE_REPORT_BUG_MSG);
		}
	}
}

/**
 * @param irGroup {Ir.Group}
 * @param arg {Node.ArgumentNode}
 * @private
 */
function compileDateArgument (irGroup, arg)
{
	/** @type {Ir.Date} */
	var irStart;
	/** @type {Ir.Date} */
	var irEnd = null;
	var isSplit = false;

	if (arg.isWildcard)
	{
		irStart = new Ir.Date(null, 1, 1);
		irEnd = new Ir.Date(null, 12, 31);
	}
	else
	{
		var start = arg.range.start;
		irStart = new Ir.Date(start.year, start.month, start.day);

		if (arg.range.end !== null)
		{
			var end = arg.range.end;
			irEnd = new Ir.Date(end.year, end.month, end.day);
		}
		else if (arg.hasInterval)
		{
			// if there is an interval, but no end value specified, then the end value is implied
			irEnd = new Ir.Date(null, 12, 31);
		}

		// check for split range (spans January 1) - not applicable for dates with explicit years
		if (irEnd !== null && !start.year)
		{
			if (irStart.month >= irEnd.month &&
				(irStart.month > irEnd.month || irStart.day > irEnd.day))
			{
				isSplit = true;
			}
		}
	}

	var irArg = new Ir.DateRange(irStart, irEnd, arg.hasInterval ? arg.intervalValue : 0, isSplit, arg.range ? arg.range.isHalfOpen : false);
	(arg.isExclusion ? irGroup.datesExcluded : irGroup.dates).push(irArg);
}

/**
 * @param irGroup {Ir.Group}
 * @param arg {Node.ArgumentNode}
 * @private
 */
function compileSecondsArgument (irGroup, arg)
{
	var irArg = compileIntegerArgument(arg, 0, 59);
	(arg.isExclusion ? irGroup.secondsExcluded : irGroup.seconds).push(irArg);
}

/**
 * @param irGroup {Ir.Group}
 * @param arg {Node.ArgumentNode}
 * @private
 */
function compileMinutesArgument (irGroup, arg)
{
	var irArg = compileIntegerArgument(arg, 0, 59);
	(arg.isExclusion ? irGroup.minutesExcluded : irGroup.minutes).push(irArg);
}

/**
 * @param irGroup {Ir.Group}
 * @param arg {Node.ArgumentNode}
 * @private
 */
function compileHoursArgument (irGroup, arg)
{
	var irArg = compileIntegerArgument(arg, 0, 23);
	(arg.isExclusion ? irGroup.hoursExcluded : irGroup.hours).push(irArg);
}

/**
 * @param irGroup {Ir.Group}
 * @param arg {Node.ArgumentNode}
 * @private
 */
function compileDaysOfWeekArgument (irGroup, arg)
{
	var irArg = compileIntegerArgument(arg, 1, 7);
	(arg.isExclusion ? irGroup.daysOfWeekExcluded : irGroup.daysOfWeek).push(irArg);
}

/**
 * @param irGroup {Ir.Group}
 * @param arg {Node.ArgumentNode}
 * @private
 */
function compileDaysOfMonthArgument (irGroup, arg)
{
	var irArg = compileIntegerArgument(arg, 1, 31);
	(arg.isExclusion ? irGroup.daysOfMonthExcluded : irGroup.daysOfMonth).push(irArg);
}

/**
 * @param irGroup {Ir.Group}
 * @param arg {Node.ArgumentNode}
 * @private
 */
function compileDaysOfYearArgument (irGroup, arg)
{
	var irArg = compileIntegerArgument(arg, 1, 366);
	(arg.isExclusion ? irGroup.daysOfYearExcluded : irGroup.daysOfYear).push(irArg);
}

/**
 * @param arg {Node.ArgumentNode}
 * @param wildStart {number}
 * @param wildEnd {number}
 * @return {Ir.IntegerRange}
 * @private
 */
function compileIntegerArgument (arg, wildStart, wildEnd)
{
	var start, end;
	var isSplit = false;

	if (arg.isWildcard)
	{
		start = wildStart;
		end = wildEnd;
	}
	else
	{
		start = arg.range.start.value;
		end = arg.range.end ? arg.range.end.value : null;

		if (end === null && arg.hasInterval)
		{
			// if there is an interval, but no end value specified, then the end value is implied
			end = wildEnd;
		}

		// check for a split range
		if (end !== null && end < start)
		{
			// Start is greater than end, so it's probably a split range, but there's one exception.
			// If this is a month expression, and end is a negative number (counting back from the end of the month)
			// then it might not actually be a split range
			if (start < 0 || end > 0)
			{
				// check says that either start is negative or end is positive
				// (means we're probably not in the weird day of month scenario)
				// todo: implement a better check which looks for possible overlap between a positive start and negative end
				isSplit = true;
			}
		}
	}

	return new Ir.IntegerRange(start, end, arg.hasInterval ? arg.intervalValue : 0, isSplit, arg.range ? arg.range.isHalfOpen : false);
}

/**
 * @return {Ir.IntegerRange}
 * @private
 */
function getZeroInteger ()
{
	return new Ir.IntegerRange(0, null, 0, false, false);
}
