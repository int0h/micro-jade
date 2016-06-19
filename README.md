# WARNING! It's very very alpha.

# micro-jade
The main purpose of this small library is to allow using the simplest Jade (pug) templates without having Jade(pug) installed. It is not support any logic inside template. So operators 'if', 'each' etc. are not supported. Also original Jade does a lot of optimisation while micro-jade doesn't.

# Usage:
```
var mj = require('../../index.js');
var fs = require('fs');

var jadeCode = fs.readFileSync('./tpl.jade').toString();

var html = mj.make(jadeCode, {
	name: "William",
	age: 22,
	gender: "male"
});

fs.writeFileSync('./output.html', html);

```