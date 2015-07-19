"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var TokenType = require('./TokenType');

/* =============================================================================
 * 
 * Token
 *  
 * ========================================================================== */

module.exports = Token;

function Token ()
{
	/** @type {number} */
	this.type = TokenType.None;
	/** @type {string} */
	this.rawValue = null;
	/** @type {string} */
	this.value = null;
	/** @type {number} */
	this.index = 0;
	/** @type {string} */
	this.leadingTrivia = null;
	/** @type {string} */
	this.trailingTrivia = null;
}
