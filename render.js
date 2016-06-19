var utils = require('./utils.js');
var StrTpl = require('./strTpl.js');

var selfClosingTags = ["area", "base", "br", "col", 
	"command", "embed", "hr", "img", 
	"input", "keygen", "link", 
	"meta", "param", "source", "track", 
	"wbr"];

var especialTags = {
	"doctype": function(tagInfo){
		var val = tagInfo.innerHTML.replace(/\n/g, '').trim();
		return '<!DOCTYPE ' + val + '>';
	}
};

function objFor(obj, fn){
	for (var i in obj){
		fn(obj[i], i, obj);
	};
};

function renderTagWrapper(tagInfo){
	var attrs = tagInfo.attrs;	
	var pairs = [];
	for (var name in attrs){
		var value = attrs[name].value;
		pairs.push(name + '="' + value + '"');
	};
	var attrCode = '';
	if (pairs.length > 0){
		attrCode = ' ' + pairs.join('');
	};
	var tagHead = tagInfo.name + attrCode;
	if (~selfClosingTags.indexOf(tagInfo.name)){
		return ["<" + tagHead + " />"];
	};
	var especial = especialTags[tagInfo.name];
	if (especial){
		return [especial(tagInfo)];
	};
	var openTag = "<" + tagHead + ">";
	var closeTag = "</" + tagInfo.name + ">";
	return [openTag, closeTag];
};
exports.renderTagWrapper = renderTagWrapper;	

function renderTag(tagInfo){
	var wrap = renderTagWrapper(tagInfo);
	var code = wrap.join(tagInfo.innerHTML || "");
	return code;	
};
exports.renderTag = renderTag;	

function renderAttrs(attrs, data){
	var resAttrs = {};
	objFor(attrs, function(value, name){
		var nameTpl = new StrTpl(name);
		var valueTpl = new StrTpl(value);
		resAttrs[nameTpl.render(data)] = valueTpl.render(data);		
	});	
	return resAttrs;
};
exports.renderAttrs = renderAttrs;

function getAttrsPaths(attrs){
	var paths = [];
	objFor(attrs, function(value, name){
		var nameTpl = new StrTpl(name);
		var valueTpl = new StrTpl(value);
		paths = paths.concat(nameTpl.getPaths(), valueTpl.getPaths());		
	});
	return paths;
};
exports.getAttrsPaths = getAttrsPaths;


function render(ast, data){
	if (ast.type == "comment"){
		return "";
	};
	if (ast.type == "text"){
		return ast.text;
	};
	if (ast.type == "root"){
		return ast.children.map(function(child){
			return render(child, data);
		}).join('');
	};
	if (ast.type != "tag"){
		return "";
	};	
	var inner;
	if (ast.value){
		var path = ast.value.split('.');
		var inner = utils.objPath(path, data);
	}else{
		inner = ast.children.map(function(child){
			return render(child, data);
		}).join('');
	};
	return renderTag({
		name: ast.tagName,
		attrs: ast.attrs,
		innerHTML: inner
	});
};
exports.render = render;

function renderWrapper(ast, data){
	if (ast.type != "tag"){
		return [];
	};
	return renderTagWrapper({
		name: ast.tagName,
		attrs: ast.attrs
	});
};
exports.renderWrapper = renderWrapper;