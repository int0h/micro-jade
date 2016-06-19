function parseTabTree(code, opts){    

    function Node(parent, code){
        this.parent = parent;
        if (parent){
            parent.children.push(this);
        };
        this.code = code;
        this.children = [];
    };

    opts = opts || {
        tabLen: 4
    };

    var tabStr = '';
    var i = opts.tabLen;
    while (i--){
        tabStr += ' ';
    }

    var ast = new Node(null, null);
    var stack = [{
        node: ast,
        offset: -1
    }];
    var lines = code.split('\n');

    lines.forEach(function(line, num){
        var tab = /^[\ \t]*/.exec(line)[0];        
        var offset = tab.replace(/\t/g, tabStr).length;
        stack = stack.filter(function(parent){
           return offset > parent.offset; 
        });
        var parent = stack.slice(-1)[0];
        var node = new Node(parent.node, line.slice(tab.length));
        node.num = num;
        node.offset = offset;
        stack.push({
            node: node,
            offset: offset
        });
    });

    return ast;
};

module.exports = parseTabTree;