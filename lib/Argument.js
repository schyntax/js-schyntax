"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

//

/* =============================================================================
 * 
 * Argument Class - Represents an AST argument.
 *  
 * ========================================================================== */

module.exports = Argument;

function Argument (type, value, isExclude, modulus, firstToken)
{
	this.type = type;
	this.value = value;
	this.isExclude = isExclude;
	this.firstToken = firstToken;
	this.modulus = modulus;
}
