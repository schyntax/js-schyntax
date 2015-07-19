"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Exceptions = require('./Exceptions');
var TokenType = require('./TokenType');
var Util = require('util');

/* =============================================================================
 * 
 * Node - Base class for all nodes.
 *  
 * ========================================================================== */

module.exports = Node;

function Node ()
{
	/** @member {Token[]} */
	this.tokens = [];
	
}

Object.defineProperty(Node.prototype, 'index', {
	get: function () { return this.tokens[0].index; }
});

/**
 * @param tok {Token}
 */
Node.prototype.addToken = function (tok)
{
	this.tokens.push(tok);
};

/* =============================================================================
 * 
 * Nodes
 *  
 * ========================================================================== */

Node.ProgramNode = function ()
{
	Node.call(this);
	
	/** @member {Node.GroupNode[]} */
	this.groups = [];
	/** @member {Node.ExpressionNode[]} */
	this.expressions = [];
};
Util.inherits(Node.ProgramNode, Node);

/** @param group {Node.GroupNode} */
Node.ProgramNode.prototype.addGroup = function (group)
{
	this.groups.push(group);
};

/** @param exp {Node.ExpressionNode} */
Node.ProgramNode.prototype.addExpression = function (exp)
{
	this.expressions.push(exp);
};

/* -----------------------------------------------------------------*/

Node.GroupNode = function ()
{
	Node.call(this);
	
	/** @member {Node.ExpressionNode[]} */
	this.expressions = [];
};
Util.inherits(Node.GroupNode, Node);

/** @param exp {Node.ExpressionNode} */
Node.GroupNode.prototype.addExpression = function (exp)
{
	this.expressions.push(exp);
};

/* -----------------------------------------------------------------*/

Node.ExpressionNode = function (expressionType)
{
	Node.call(this);
	
	this.expressionType = expressionType;
	/** @member {Node.ArgumentNode[]} */
	this.arguments = [];
};
Util.inherits(Node.ExpressionNode, Node);

/** @param arg {Node.ArgumentNode} */
Node.ExpressionNode.prototype.addArgument = function (arg)
{
	this.arguments.push(arg);
};

/* -----------------------------------------------------------------*/

Node.ArgumentNode = function ()
{
	Node.call(this);
	
	this.isExclusion = false;
	/** @member {Node.IntegerValueNode} */
	this.interval = null;
	this.isWildcard = false;
	/** @member {Node.RangeNode} */
	this.range = null;
};
Util.inherits(Node.ArgumentNode, Node);

Object.defineProperty(Node.ArgumentNode.prototype, 'hasInterval', {
	get: function () { return this.interval !== null; }
});

Object.defineProperty(Node.ArgumentNode.prototype, 'intervalValue', {
	get: function () { return this.interval.value; }
});

Object.defineProperty(Node.ArgumentNode.prototype, 'isRange', {
	get: function () { return this.range && this.range.end; }
});

Object.defineProperty(Node.ArgumentNode.prototype, 'value', {
	get: function () { return this.range ? this.range.start : null; }
});

Object.defineProperty(Node.ArgumentNode.prototype, 'intervalTokenIndex', {
	get: function ()
	{
		for (var i = 0; i < this.tokens.length; i++)
		{
			/** @type {Token} */
			var t = this.tokens[i];
			if (t.type === TokenType.Interval)
				return t.index;
		}
		
		throw new Error("No interval token found." + Exceptions.PLEASE_REPORT_BUG_MSG);
	}
});

/* -----------------------------------------------------------------*/

Node.RangeNode = function ()
{
	Node.call(this);
	
	/** @member {Node.ValueNode} */
	this.start = null;
	/** @member {Node.ValueNode} */
	this.end = null;
	this.isHalfOpen = false;
};
Util.inherits(Node.RangeNode, Node);

/* -----------------------------------------------------------------*/

Node.ValueNode = function ()
{
	Node.call(this);
};
Util.inherits(Node.ValueNode, Node);

/* -----------------------------------------------------------------*/

Node.IntegerValueNode = function ()
{
	Node.ValueNode.call(this);
	
	/** @member {number} */
	this.value = 0;
};
Util.inherits(Node.IntegerValueNode, Node.ValueNode);

/* -----------------------------------------------------------------*/

Node.DateValueNode = function ()
{
	Node.ValueNode.call(this);
	
	/** @member {number?} */
	this.year = null;
	this.month = 0;
	this.day = 0;
};
Util.inherits(Node.DateValueNode, Node.ValueNode);

