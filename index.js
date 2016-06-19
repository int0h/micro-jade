exports.parse = require('./parser.js').parse;
exports.render = require('./render.js').render;
exports.renderWrapper = require('./render.js').renderWrapper;

exports.make = function(code, data){
	var parsed = exports.parse(code);
	return exports.render(parsed);
};