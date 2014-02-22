if (typeof require !== "undefined") {
   var Expression = require("../lib/expression.js");
}

var ok = function(a, msg) { if (!a) throw new Error(msg || "not ok"); };
var eq = function(a, b) { if (a!==b) throw new Error(a + " !== " + b); };

describe('Expression', function() {
  it('sets up the prototype.constructor', function() {
    ok(Expression().constructor === Expression);
  });

  describe('constructor', function() {
    it('creates a new instance when called like a function', function() {
      ok(Expression() instanceof Expression);
      ok((new Expression()) instanceof Expression);
    });
  });

  describe('Instance Methods', function() {
    describe('#toString', function() {
      it('stringifies const op const', function() {
        ['+', '-', '*', '/'].forEach(function(op) {
          var str = Expression.createOperation(
            op,
            Expression.createConstant(10),
            Expression.createConstant(20)
          ).toString();

          eq(str, '(10 ' + op + ' 20)');
        });
      });

      it('stringifies fn(const)', function() {
        [['negate','-'], 'sqrt', 'square', 'sin', 'cos'].forEach(function(op) {
          var str = Expression.createOperation(
            (op.length === 2) ? op[0] : op,
            Expression.createConstant(10)
          ).toString();

          eq(str, ((op.length === 2) ? op[1] : op) + '(10)');
        });
      });

    });
  });

  describe('Expression Methods', function() {

    describe('Expression.createParameter', function() {
      it('creates a new param', function() {
        var e = Expression.createParameter('abc');
        eq(e.param, 'abc');
        eq(e.op, 'parameter');
      });

    });

    describe('Expression.createConstant', function() {
      it('creates a new param', function() {
        var e = Expression.createConstant(10);
        eq(e.value, 10);
        eq(e.op, 'constant');
      });
    });

    describe('Expression.createOperation', function() {
      it('creates an expression that operates on 1 expression', function() {
        var a = Expression.createConstant(10);
        var e = Expression.createOperation('+', a);

        eq(a, e.e0);
        eq(e.e1, null);
      });

      it('creates an expression that operates on 2 expressions', function() {
        var a = Expression.createConstant(10);
        var b = Expression.createConstant(20);
        var e = Expression.createOperation('+', a, b);

        eq(a, e.e0);
        eq(b, e.e1);
      });
    });
  });
});
