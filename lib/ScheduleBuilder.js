"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Argument = require('./Argument');
var Common = require('./Common');
var Range = require('./Range');
var RuleGroup = require('./RuleGroup');
var Token = require('./Token');

/* =============================================================================
 * 
 * ScheduleBuilder Class
 * 
 * For parsing the schedule syntax.
 *  
 * ========================================================================== */

module.exports = ScheduleBuilder;

function ScheduleBuilder (str)
{
	/** @type {string} */
	this.text = str;
	/** @type {Token[]} */
	this.tokens = [];
	this.ast = [];
}

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

ScheduleBuilder.prototype.buildAbstractSyntaxTree = function ()
{
	var i = 0;
	while (i < this.tokens.length)
	{
		// check token type
		if (this.tokens[i].isCommand)
		{
			// token is a keyword/command
			i = this.buildCommand(i, this.ast);
		}
		else
		{
			// commas between top-level commands are optional. No other special tokens are allowed.
			if (i > 0 && this.tokens[i].value === ',')
			{
				i++;
				continue;
			}
			
			// can't have a special token or number outside of a command
			throw this.syntaxError('Unexpected token. Expected a command.', this.tokens[i]);
		}
	}
};

/**
 * @param i {number}
 * @param context {Array}
 * @returns {number}
 */
ScheduleBuilder.prototype.buildArgument = function (i, context)
{
	var tokens = this.tokens;
	var t = tokens[i];
	var firstToken = t;

	if (!t)
		return i; // let the command handle this syntax error

	var negative = false;
	var isExclude = false;
	
	if (t.value === '!')
	{
		isExclude = true;
		t = tokens[++i];
	}
	
	if (t.isSpecial)
	{
		if (t.value === ')')
			return i;

		if (t.value === ',')
			throw this.syntaxError('Empty argument', t);
		
		if (t.value === '-')
		{
			negative = true;
			t = tokens[++i];
		}
		else
		{
			throw this.syntaxError('Unexpected token in argument.', t);
		}
	}

	// check for argument type
	if (t.isCommand)
	{
		// command can't be preceded by a minus or !
		if (negative || isExclude)
			throw this.syntaxError('Unexpected token in argument.', tokens[i - 1]);
		
		return this.buildCommand(i, context);
	}
	
	var low;
	var isDay = false;
	if (t.isDayKeyword)
	{
		isDay = true;
		low = t.toDayOfWeek();
	}
	else
	{
		// argument should be a number or range
		low = Number(t.value);
		if (isNaN(low))
			throw this.syntaxError('Unknown argument syntax', t);

		if (negative)
		{
			negative = false;
			low *= -1;
		}
	}

	// check for range
	t = tokens[++i];
	if (t.value === '-')
	{
		t = tokens[++i];
		
		if (t.isDayKeyword)
		{
			isDay = true;
			high = t.toDayOfWeek();
		}
		else
		{
			if (t.value === '-')
			{
				negative = true;
				t = tokens[++i];
			}

			var high = Number(t.value);
			if (isNaN(high))
				throw this.syntaxError('Unknown argument syntax', t);

			if (negative)
				high *= -1;
		}

		i++;
		
		context.push(new Argument(isDay ? 'days' : 'range', new Range(low, high), isExclude, firstToken));
	}
	else if (isDay)
	{
		context.push(new Argument('days', new Range(low, low), isExclude, firstToken));
	}
	else
	{
		// just a plain ole number
		context.push(new Argument('number', low, isExclude, firstToken));
	}

	return i;
};

/**
 * @param i {number}
 * @param context {Array}
 * @returns {number}
 */
ScheduleBuilder.prototype.buildCommand = function (i, context)
{
	var start = i;
	var tokens = this.tokens;

	var cmd = {
		type: "command",
		name: tokens[i].value,
		arguments: [],
		firstToken: tokens[i]
	};

	i++;
	if (i >= tokens.length)
	{
		throw this.syntaxError('Command has no opening parenthesis.', tokens[i - 1]);
	}

	if (tokens[i].value !== '(')
	{
		throw this.syntaxError('Unexpected an opening parenthesis.', tokens[i]);
	}

	// get the command's arguments
	i++;
	while (tokens[i])
	{
		if (tokens[i].value === ')')
			break;

		i = this.buildArgument(i, cmd.arguments);
		if (tokens[i] && tokens[i].value === ',')
			i++;
	}

	if (!tokens[i] || tokens[i].value !== ')')
		throw this.syntaxError('Command is missing a closing parenthesis.', tokens[start]);

	context.push(cmd);
	return i + 1;
};

/**
 * @returns {RuleGroup[]}
 */
ScheduleBuilder.prototype.compile = function ()
{
	var rules = [];
	var globalCommands = [];
	var ast = this.ast;
	var cmd, rule;
	
	for (var i = 0; i < ast.length; i++)
	{
		cmd = ast[i];
		if (cmd.type !== 'command')
		{
			throw this.syntaxError('Syntax Tree is invalid. Top-level item is not a command.', cmd.firstToken);
		}
		
		if (cmd.name === 'group')
		{
			rule = this.compileGroup(cmd.arguments);
			if (rule === null)
				throw this.syntaxError('No rules in schedule.', cmd.firstToken);
			
			rules.push(rule);
		}
		else
		{
			// top level commands go into an implicit group
			globalCommands.push(cmd);
		}
	}
	
	if (globalCommands.length > 0)
	{
		rule = this.compileGroup(globalCommands);
		if (rule === null)
			throw this.syntaxError('No rules in schedule.', globalCommands[i].firstToken);
		
		rules.push(rule);
	}
	
	return rules;
};

ScheduleBuilder.prototype.compileGroup = function (commands)
{
	var rule = new RuleGroup();
	
	/** @type {Argument} */
	var arg;
	var cmd, name, x, args, propType, prop, max, min, low, high;
	var somethingSet = false;
	for (var i = 0; i < commands.length; i++)
	{
		cmd = commands[i];
		if (!cmd || cmd.type !== 'command')
		{
			throw this.syntaxError('Expected a command argument.', cmd.firstToken);
		}
		
		name = cmd.name.toLowerCase();
		
		switch (name)
		{
			case 'm':
			case 'min':
			case 'minute':
			case 'minutes':
			case 'minuteofhour':
			case 'minutesofhour':
				propType = 'minutes';
				min = 0;
				max = 59;
				break;
			case 'h':
			case 'hour':
			case 'hours':
			case 'hourofday':
			case 'hoursofday':
				propType = 'hours';
				min = 0;
				max = 23;
				break;
			case 'w':
			case 'day':
			case 'days':
			case 'dow':
			case 'dayofweek':
			case 'daysofweek':
				propType = 'daysOfWeek';
				min = 1;
				max = 7;
				break;
			case 'dom':
			case 'dayofmonth':
			case 'daysofmonth':
				propType = 'daysOfMonth';
				min = -31;
				max = 30;
				break;
			case 'date':
			case 'dates':
				propType = 'dates';
				min = 1;
				max = 31;
				break;
			default:
				throw this.syntaxError('Unknown expression ' + cmd.name, cmd.firstToken);
		}
		
		args = cmd.arguments.slice();
		if (args.length === 0 && propType !== 'dates')
		{
			args.push(new Argument('range', new Range(min, max), false, cmd.firstToken));
		}

		// normalize and validate the command arguments
		for (x = 0; x < args.length; x++)
		{
			arg = args[x];
			if (arg.type !== 'number' && (arg.type === 'days' || propType === 'daysOfWeek'))
			{
				if (propType !== 'daysOfWeek')
					throw this.syntaxError('Weekday names can only be used inside daysOfWeek expressions.', arg.firstToken);
				
				if (arg.type !== 'days' && arg.type !== 'range')
					throw this.syntaxError('Invalid argument in ' + name + ' expression.', arg.firstToken);
				
				low = arg.value.low | 0;
				high = arg.value.high | 0;
				
				if (high < low)
				{
					// the day range spans a sat/sun boundary, so we need to split it into two ranges
					args.push(new Argument('days', new Range(1, high), arg.isExclude, arg.firstToken));
					high = 7;
				}
			}
			else if (arg.type === 'number')
			{
				high = low = arg.value | 0;
				if (propType === 'dates')
					throw this.syntaxError('Invalid date argument.', arg.firstToken);
			}
			else if (arg.type === 'range')
			{
				low = arg.value.low | 0;
				high = arg.value.high | 0;

				// low cannot be greater than high, unless high is a negative and low is positive.
				// Negative numbers are considered higher than positive since they count from the back of an interval.
				// Also don't swap if "range" is actually a date.
				if (propType !== 'dates' && low > high && !(low >= 0 && high < 0))
				{
					throw this.syntaxError(propType + ' range argument is invalid. Low range cannot be greater than high range.', arg.firstToken);
				}
			}
			else
			{
				throw this.syntaxError('Argument must be a number or range.', arg.firstToken);
			}
			
			if (low < min)
				throw this.syntaxError('Minimum '+ propType +' value is '+ min, arg.firstToken);
			
			if (high > max)
				throw this.syntaxError('Maximum '+ propType +' value is '+ max, arg.firstToken);
			
			if (propType === 'daysOfMonth' && (low === 0 || high === 0))
				throw this.syntaxError('Day of month cannot be zero.', arg.firstToken);
			
			if (propType === 'daysOfWeek')
			{
				// JavaScript weekdays start at zero
				low--;
				high--;
			}
			
			if (propType === 'dates')
			{
				if (low < 1 || low > 12)
					throw this.syntaxError('Invalid date.', arg.firstToken);
				
				low--; // JavaScript months start at zero for some reason
				if (high > Common.daysInMonth(low))
					throw this.syntaxError('Invalid date.', arg.firstToken);
			}
			
			prop = arg.isExclude ? propType + 'Exclude' : propType;
			if (!rule[prop])
				rule[prop] = [];
			
			rule[prop].push(new Range(low, high));
			somethingSet = true;
		}
	}
	
	if (!somethingSet)
		return null;

	// setup some rules automatically in certain circumstances
	if (rule.hours || rule.hoursExclude)
	{
		// if hours are set but minutes are not, add a default minute include of 0 minutes
		// otherwise it'll run on every minute of the included hours
		if (!rule.minutes && !rule.minutesExclude)
		{
			rule.minutes = [new Range(0, 0)];
		}
	}
	else if (rule.dates || rule.datesExclude || 
		rule.daysOfMonth || rule.daysOfMonthExclude || 
		rule.daysOfWeek || rule.daysOfWeekExclude)
	{
		// if some form of days are set, but hours and minutes are not, set defaults of 0 minutes and 0 hours
		// otherwise it's going to run every minute of the day on included days
		// don't need to re-check hours here because we won't get to this else-if if hours are set
		if (!rule.minutes && !rule.minutesExclude)
		{
			rule.hours = [new Range(0, 0)];
			rule.minutes = [new Range(0, 0)];
		}
	}
	
	
	return rule;
};

/**
 * @param message {string}
 * @param token {Token}
 * @returns {SyntaxError}
 */
ScheduleBuilder.prototype.syntaxError = function (message, token)
{
	var startIndex = Math.max(token.index - 10, 0);
	var endIndex = Math.min(token.index + token.value.length + 20, this.text.length);

	var sub = this.text.substring(startIndex, endIndex);
	var pointer = '';
	for (var i = startIndex; i < endIndex; i++)
	{
		pointer += i === token.index ? '^' : ' ';
	}

	return new SyntaxError(message + '\n    ' + sub + '\n    ' + pointer);
};

ScheduleBuilder.prototype.tokenize = function ()
{
	var str = this.text;
	var token = new Token(0);
	var tokens = this.tokens;
	for (var i = 0; i < str.length; i++)
	{
		switch (str[i])
		{
			case ' ':
			case '\t':
			case '\n':
			case '\r':
				if (token.value)
					tokens.push(token);
				token = new Token(i + 1);
				break;
			case '(':
			case ')':
			case '-':
			case ',':
			case '!':
				if (token.value)
					tokens.push(token);
				tokens.push(new Token(i, str[i]));
				token = new Token(i + 1);
				break;
			default:
				token.value += str[i];
				break;
		}
	}

	if (token.value)
		tokens.push(token);
};

