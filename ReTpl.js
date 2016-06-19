var gapRe = /\[\!(\w+)\]/g;

function ReTpl(reTpl, parts){    
    var source = reTpl.source;
    this.map = [];
    var self = this;
    var newSource = source.replace(gapRe, function(subStr, name){
        self.map.push(name);
        return '(' + parts[name].source + ')';
    });
    var flags = reTpl.global ? 'g' : ''
        + reTpl.multiline ? 'm' : ''
        + reTpl.ignoreCase ? 'i' : '';
    this.re = new RegExp(newSource, flags);
};

ReTpl.prototype.find = function(str, offset){  
    var self = this;
    this.re.lastIndex = offset || 0;
    var res = this.re.exec(str);
    if (!res){
        return null;  
    };
    var resObj = {
        full: res[0],
        parts: {}
    };
    res.slice(1).forEach(function(part, id){
        var key = self.map[id];
        resObj.parts[key] = part || null;
    });
    return resObj;
};

ReTpl.prototype.findAll = function(str, offset){  
    var res = [];
    this.re.lastIndex = offset || 0;
    while (true){
        var found = this.find(str, this.re.lastIndex);
        if (!found){
            return res;
        };
        res.push(found);
    };
    return res; // never go there
};

module.exports = ReTpl;