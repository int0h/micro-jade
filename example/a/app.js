var mj = require('../../index.js');
var fs = require('fs');

var jadeCode = fs.readFileSync('./tpl.jade').toString();

var html = mj.make(jadeCode, {
	name: "William",
	age: 22,
	gender: "male"
});

fs.writeFileSync('./output.html', html);
