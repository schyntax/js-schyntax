"use strict";

var Schedule = require('./Schedule');

module.exports = function (format)
{
	return new Schedule(format);
};
