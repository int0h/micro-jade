var ReTpl = require('./ReTpl.js');
var parseTabTree = require('./parseTabTree.js');

var gapRe = /\[\!(\w+)\]/g;

function makeRe(dict, re){
	var source = re.source;
	var newSource = source.replace(gapRe, function(subStr, name){
		return dict[name].source;
	});
	var flags = re.global ? 'g' : ''
        + re.multiline ? 'm' : ''
        + re.ignoreCase ? 'i' : '';
	return new RegExp(newSource, flags);  
};

// find single/double quoted Strings [http://stackoverflow.com/questions/249791/regex-for-quoted-string-with-escaping-quotes]
var qutedStrRe = /"(?:[^"\\]*(?:\\.[^"\\]*)*)"|\'(?:[^\'\\]*(?:\\.[^\'\\]*)*)\'/; 
var idfRe = /[a-zA-Z0-9_\-]+/;
var attrRe = makeRe({
		idf: idfRe,
		dqs: qutedStrRe
}, /[!idf]\=?(?:[!idf]|[!dqs])?/);

var prep = makeRe.bind(null, {
	idf: idfRe,
	attr: attrRe
});

var tabRe = /\s*/;

var classIdPartRe = prep(/[\.\#]{1}[!idf]/g);
var classIdRe = makeRe({part: classIdPartRe}, /(?:[!part])+/g);

var tagLine = new ReTpl(
/^[!tag]?[!classId]?[!attrs]?[!text]?[!multiline]?[!value]?[\t\ ]*$/g, {
	tab: tabRe,
	tag: prep(/[!idf]/),
	classId: classIdRe,
	attrs: prep(/\((?:[!attr]\s*\,?\s*)*\)/),
	value: /\=[^\n]*/,
	text: /\ [^\n]*/,
	multiline: /\.[\ \t]*/,
	value: /\=[^\n]*/
});

var whitespace = new ReTpl(/^\s*$/g, {

});

var textLine = new ReTpl(/^\|[!text]$/, {
	text: /[^\n]*/
});

var commentLine = new ReTpl(/^\/\/\-?[!text]$/, {
	text: /[^\n]*/
});

function collapseToStr(ast){
	var lines = [ast.code].concat(ast.children.map(collapseToStr));
	return lines.join('\n');
};

function parseClassId(str){
	var res = {
		classes: [],
		id: null
	};
	var parts = str.match(classIdPartRe).forEach(function(part){
		if (part[0] == "#"){
			res.id = part.slice(1);
			return;
		};
		res.classes.push(part.slice(1));
	});
	return res;
};

var attrPairRe = new ReTpl(/(?:[!name]\=?(?:[!key]|[!strValue])?)\,?\s*/g, {
		name: idfRe,
		key: idfRe,
		strValue: qutedStrRe
})

function parseAttrs(str){
		var attrObj = {};
		if (!str){
				return attrObj;
		};
		str = str.slice(1, -1);
		var pairs = attrPairRe.findAll(str);
		pairs.forEach(function(pair){
			var name = pair.parts.name;
			var value;
				if (pair.parts.key){
					value = {
					type: "varible",
					key: pair.parts.key
				};
			}else{
				value = {
					type: "string",
					value: pair.parts.strValue.slice(1, -1)
				};
			}
			attrObj[name] = value; 
			});
		return attrObj;
};

var tokens = {
	tag: {
		rule: function(str){
			if (/^\s*$/g.test(str)){
				return null;
			};
			return tagLine.find(str); 
		},
		tranform: function(found, ast, parent){            
			var node = {
				type: 'tag',
				tagName: found.parts.tag || 'div',
				attrs: {},
				parent: parent
			};
			var classes = [];
			var classId = found.parts.classId;
			var id;
			if (classId){
				var parsed = parseClassId(classId);
				if (parsed.id){
					id = parsed.id
				};
				classes = classes.concat(parsed.classes);
			};
			var attrs = parseAttrs(found.parts.attrs);
			if (!attrs.id && id){
				attrs.id = id;
			};
			var classAttr = attrs["class"];
			if (classAttr){				
				if (attrs["class"].type == "string"){
					classes = classes.concat(attrs["class"].value.split(' '));
				};
			}else{
				if (classes.length > 0){
					attrs["class"] = {
						type: "string",
						value: classes.join(' ')
					};
				};	
			};            
			node.attrs = attrs;
			var text;
			if (found.parts.value){
				node.value = found.parts.value.replace(/^\s*\=\s*/g, '');
				node.children = [];
				return node;
			};
			if (found.parts.multiline){
				node.children = [{
					type: 'text',
					text: ast.children.map(collapseToStr).join('\n')
				}];
				return node;                  
			};
			if (found.parts.text){
				node.children = [{
					type: 'text',
					text: found.parts.text
				}];
				return node;   
			};
			node.children = ast.children.map(transformAst.bind(null, node));
			return node;
		}
	},
	text: {
		rule: textLine,
		tranform: function(found, ast, parent){
			return {
				type: 'text',
				text: found.parts.text,
				parent: parent
			}
		}
	},
	whitespace: {
		rule: whitespace,
		tranform: function(found, ast, parent){
			return {
				type: 'whitespace',
				parent: parent
			}
		}
	},
	comment: {
		rule: commentLine,
		tranform: function(found, ast, parent){
			return {
				type: 'comment',
				text: found.parts.text,
				parent: parent
			}
		}
	}
};

function transformAst(parent, ast, meta){
		var found;
		var token;
		for (var name in tokens){
			token = tokens[name];
			var line = ast.code.replace(/\r/g, '');
			found = typeof token.rule == "function" 
				? token.rule(line)
				: token.rule.find(line);
			if (found){
				break;
			};        
		};
		if (!found){
			throw new Error('token not found (line: ' + ast.num + '): "' + ast.code + '"\n');
		};
		return token.tranform(found, ast, parent);
		
};

function parse(code){
	code = code.toString();
	var ast = {
		type: "root"
	};
	var tabAst = parseTabTree(code);
	ast.children = tabAst.children.map(transformAst.bind(null, ast));  
	return ast;  

};



exports.parse = parse;