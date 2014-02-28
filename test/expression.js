if (typeof require !== "undefined") {
   var Expression = require("../lib/expression.js");
   var Param = require("../lib/param.js");
}

var ok = function(a, msg) { if (!a) throw new Error(msg || "not ok"); };
var eq = function(a, b) { if (a!==b) throw new Error(a + " !== " + b); };

var throws = function(fn) {
  var caught;
  try { fn(); } catch (e) {
    caught = true;
  }

  if (!caught) {
    throw new Error('did not throw as expected');
  }
};


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

      it('stringifies parameters (basic)', function() {
        ['+', '-', '*', '/'].forEach(function(op) {
          var p = new Param(10);
          var p2 = new Param(20);

          var str = Expression.createOperation(op, p, p2).toString();

          eq(str, '({10} ' + op + ' {20})');
        });
      });
    });

    describe('#evaluate', function() {
      it('evaluates constants', function() {
        [['+', 30], ['-', -10], ['*', 200], ['/', .5]].forEach(function(op) {
          var v = Expression.createOperation(
            op[0],
            Expression.createConstant(10),
            Expression.createConstant(20)
          ).evaluate();

          eq(v, op[1]);
        });
      });

      it('resolves parameters', function() {
        [['+', 30], ['-', -10], ['*', 200], ['/', .5]].forEach(function(op) {
          var p = new Param(20);

          var v = Expression.createOperation(
            op[0],
            Expression.createConstant(10),
            Expression.createParameter(p)
          ).evaluate();

          eq(v, op[1]);
        });
      });

      it('throws on invalid operator', function() {
        var e =  Expression.createOperation(
          'blah',
          Expression.createConstant(10),
          Expression.createConstant(20)
        );

        throws(function() {
          e.evaluate();
        });
      });
    });

    describe('#independentOf', function() {

      it('returns true if this param is not the incoming', function() {
        var e = Expression.createParameter(Param(10));
        ok(e.independentOf(Param(50)));
      });

      it('returns false if this param is the incoming', function() {
        var p = Param(10);
        var e = Expression.createParameter(p);
        ok(!e.independentOf(p));
      });

      it('returns true if constant', function() {
        var e = Expression.createConstant(10);
        ok(e.independentOf(Param(10)));
      });

      it('recurses for nested expressions (basic)', function() {

        ['+', '-', '*', '/'].forEach(function(op) {
          var p1 = Param(5);
          var p2 = Param(10);
          var e1 = Expression.createParameter(p1)
          var e2 = Expression.createParameter(p2)

          var e3 = Expression.createOperation(op, e1, e2);

          ok(!e3.independentOf(p1))
          ok(!e3.independentOf(p2));
          ok(e3.independentOf(Param(5)));
        });
      });

      it('recurses for nested expressions (fn)', function() {

        ['sqrt', 'square', 'negate', 'sin', 'cos'].forEach(function(op) {
          var p1 = Param(5);
          var e1 = Expression.createParameter(p1)
          var e3 = Expression.createOperation(op, e1);

          ok(!e3.independentOf(p1))
          ok(e3.independentOf(Param(5)));
        });
      });

      it('throws when an invalid operator is used', function() {
        var e = Expression.createParameter(Param(0));
        e.op = "monkey";

        throws(function() {
          e.independentOf(Param(5));
        });
      });
    });

    describe('#partial', function() {
      it('creates a partial derivative (param)', function() {
        var p = Param(10);
        var e = Expression.createParameter(p);

        // dependent var
        var r1 = e.partial(p);
        eq(r1.value, 1);
        eq(r1.op, 'constant');
        eq(r1.e0, null);
        eq(r1.e1, null);

        // independent var
        var r2 = e.partial(Param(10));
        eq(r2.value, 0);
        eq(r2.op, 'constant');
        eq(r2.e0, null);
        eq(r2.e1, null);
      });

      it('creates a partial derivative (constant)', function() {
        var p = Param(10);
        var e = Expression.createConstant(10);

        eq(e.partial().value, 0);
        eq(e.partial(Param(10)).value, 0);
      });

      it('creates a partial derivative (+)', function() {
        var p = Param(10);
        var e = Expression.createOperation('+',
          Expression.createParameter(p),
          Expression.createParameter(Param(10))
        );

        eq(e.partial(p).toString(), '(1 + 0)');
        eq(e.partial(Param(5)).toString(), '(0 + 0)');
      });

      it('creates a partial derivative (-)', function() {
        var p = Param(10);
        var e = Expression.createOperation('-',
          Expression.createParameter(p),
          Expression.createParameter(Param(10))
        );

        eq(e.partial(p).toString(), '(1 - 0)');
        eq(e.partial(Param(5)).toString(), '(0 - 0)');
      });

      it('creates a partial derivative (*)', function() {
        var p = Param(10);
        var e = Expression.createOperation('*',
          Expression.createParameter(p),
          Expression.createParameter(Param(5))
        );

        eq(e.partial(p).toString(), '(({10} * 0) + ({5} * 1))');
        eq(e.partial(Param(5)).toString(), '(({10} * 0) + ({5} * 0))');
      });

      it('creates a partial derivative (/)', function() {
        var p = Param(10);
        var e = Expression.createOperation('/',
          Expression.createParameter(p),
          Expression.createParameter(Param(5))
        );

        eq(e.partial(p).toString(), '((({5} * 1) - ({10} * 0)) / square({5}))');
        eq(e.partial(Param(5)).toString(), '((({5} * 0) - ({10} * 0)) / square({5}))');
      });

      it('creates a partial derivative (negate)', function() {
        var p = Param(10);
        var e = Expression.createOperation('negate',
          Expression.createParameter(p)
        );

        eq(e.partial(Param(10)).toString(), '-(0)');
        eq(e.partial(p).toString(), '-(1)');
      });

      it('creates a partial derivative (sqrt)', function() {
        var p = Param(10);
        var e = Expression.createOperation('sqrt',
          Expression.createParameter(p)
        );

        eq(e.partial(Param(10)).toString(), '((0.5 / sqrt({10})) * 0)');
        eq(e.partial(p).toString(), '((0.5 / sqrt({10})) * 1)');
      });

      it('creates a partial derivative (square)', function() {
        var p = Param(10);
        var e = Expression.createOperation('square',
          Expression.createParameter(p)
        );

        eq(e.partial(Param(10)).toString(), '((2 * {10}) * 0)');
        eq(e.partial(p).toString(), '((2 * {10}) * 1)');
      });

      it('creates a partial derivative (sin)', function() {
        var p = Param(10);
        var e = Expression.createOperation('sin',
          Expression.createParameter(p)
        );

        eq(e.partial(Param(10)).toString(), '(cos({10}) * 0)');
        eq(e.partial(p).toString(), '(cos({10}) * 1)');
      });

      it('creates a partial derivative (cos)', function() {
        var p = Param(10);
        var e = Expression.createOperation('cos',
          Expression.createParameter(p)
        );

        eq(e.partial(Param(10)).toString(), '-((sin({10}) * 0))');
        eq(e.partial(p).toString(), '-((sin({10}) * 1))');
      });
    });

    describe('#replaceParameter', function() {
      it('chains', function() {
        var e = Expression.createConstant(10);
        eq(e.replaceParameter(Param(5)), e);
      });

      it('ignores constants', function() {
        var e = Expression.createConstant(10);
        eq(e.replaceParameter(Param(5)).value, 10);
      })

      it('replaces a parameter with another', function() {
        var p = Param(10);
        var e = Expression.createParameter(p);
        eq(e.replaceParameter(Param(5), p).param.value(), 5);
      });

      it('replaces a parameter with another (+,-,*,/)', function() {
        var p = Param(10);
        var p2 = Param(5);
        ['+', '-', '*', '/'].forEach(function(op) {

          var e0 = Expression.createParameter(p);
          var e1 = Expression.createParameter(p2);

          var e = Expression.createOperation(op, e0, e1);

          eq(e.clone().replaceParameter(Param(2), p).toString(), '({2} ' + op + ' {5})');
          eq(e.clone().replaceParameter(Param(2), p2).toString(), '({10} ' + op + ' {2})');

          eq(e.clone().replaceParameter(Param(2), null).toString(), '({10} ' + op + ' {5})');
        });
      });

      it('replaces a parameter with another (fns)', function() {
        var p = Param(10);
        var p2 = Param(5);
        ['sqrt', 'square', 'negate', 'sin', 'cos'].forEach(function(op) {


          var e0 = Expression.createParameter(p);
          var e = Expression.createOperation(op, e0);

          if (op === 'negate') {
            op = '-';
          }

          eq(e.clone().replaceParameter(Param(2), p).toString(), op + '({2})');
          eq(e.clone().replaceParameter(Param(2), p2).toString(), op + '({10})');
        });
      });
    });

    describe('#evaluateKnown', function() {

      it('resolves known params to constants', function() {
        var e = Expression.createParameter(Param(10)).evaluateKnown();

        eq(e.op, 'constant');
      });

      it('resolves unknown params to an expression', function() {
        var e = Expression.createParameter(Param()).evaluateKnown();
        eq(e.op, 'parameter');
      });

      it('resolves constants to expressions', function() {
        var e = Expression.createConstant(10).evaluateKnown();
        eq(e.value, 10);
      });

      it('reduces constant expressions (+, -, *, /)', function() {
        [['+', 30], ['-', -10], ['*', 200], ['/', 0.5]].forEach(function(op) {

          var e = Expression.createOperation(op[0],
            Expression.createConstant(10),
            Expression.createConstant(20)
          );

          eq(e.evaluateKnown().value, op[1]);
        });
      });

      it('returns constant(0) if one side of * is 0', function() {
        var p = Param();
        var e = Expression.createOperation('*',
          Expression.createConstant(0),
          Expression.createParameter(p)
        );

        eq(e.evaluateKnown().toString(), '0');
      });

      it('reduces parametric expressions (+, -, *, /)', function() {
        [
          ['+', '(30 + (20 + ?))'],
          ['-', '(10 + (20 - ?))'],
          ['*', '(200 + (20 * ?))'],
          ['/', '(2 + (20 / ?))']
        ].forEach(function(op) {

          var param = Param();
          var e = Expression.createOperation('+',
            Expression.createOperation(op[0],
              Expression.createConstant(20),
              Expression.createConstant(10)
            ),
            Expression.createOperation(op[0],
              Expression.createConstant(20),
              Expression.createParameter(param)
            )
          );

          eq(e.evaluateKnown().toString(), op[1].replace('?', '{#' + param.id + '}'));
        });
      });

      it('reduces constant expressions (sqrt, square, negate, sin, cos)', function() {

        [
          ['sqrt', 3.1622776601683795],
          ['square', 100],
          ['negate', -10],
          ['cos', -0.8390715290764524],
          ['sin', -0.5440211108893698],
        ].forEach(function(op) {

          var e = Expression.createOperation(op[0],
            Expression.createConstant(10)
          );

          eq(e.evaluateKnown().value, op[1]);
        });
      });

      it('reduces parametric expressions (sqrt, square, negate, sin, cos)', function() {

        [
          ['sqrt', 'sqrt((30 * ?))'],
          ['square', 'square((30 * ?))'],
          ['negate', '-((30 * ?))'],
          ['cos', 'cos((30 * ?))'],
          ['sin', 'sin((30 * ?))']
        ].forEach(function(op) {

          var param = Param();
          var e = Expression.createOperation(op[0],
            Expression.createOperation('*',
              Expression.createOperation('+',
                Expression.createConstant(20),
                Expression.createConstant(10)
              ),
              Expression.createParameter(param)
            )
          );

          eq(e.evaluateKnown().toString(), op[1].replace('?', '{#' + param.id + '}'));
        });
      });
    });

    describe('#marksTwoParamsEqual', function() {
      it('returns true if the operator is "-"', function() {
        eq(Expression.createOperation('*',
          Expression.createConstant(4),
          Expression.createConstant(2)
        ).marksTwoParamsEqual(), false);
      });

      it('returns false if e0.op is not a parameter', function() {
        eq(Expression.createOperation('*',
          Expression.createOperation('*', null, null),
          Expression.createConstant(2)
        ).marksTwoParamsEqual(), false);
      });

      it('returns false if e1.op is not a parameter', function() {
        eq(Expression.createOperation('*',
          Expression.createConstant(2),
          Expression.createOperation('*', null, null)
        ).marksTwoParamsEqual(), false);
      });

      it('returns an array when e0 and e1 expressions are parameters', function() {
        var p = Param();
        var p2 = Param();
        var r = Expression.createOperation('-',
          Expression.createParameter(p),
          Expression.createParameter(p2)
        ).marksTwoParamsEqual();

        eq(r.length, 2);
        eq(r[0], p);
        eq(r[1], p2);
      });
    });

    describe('#mark', function() {

      it('increments the "mark" on a parameter', function() {
        var p = Param(10);
        var e = Expression.createParameter(p);

        var r = e.mark(10);
        eq(p.mark, 10);
        eq(r, e);
      });

      it('walks down e0 and e1', function() {

        var calls = 0;
        var track = function() {
          calls++;
        };

        var e = Expression.createOperation('+',
          { mark: track },
          { mark: track }
        );

        e.mark(5);

        eq(calls, 2);
      });

      it('applies delta to the whole expression tree', function() {
        var p = Param();
        var p2 = Param();

        var e = Expression.createOperation('+',
          Expression.createParameter(p),
          Expression.createParameter(p2)
        );

        e.mark(10);
        eq(p.mark, 10);
        eq(p2.mark, 10);
      });

      it('sets mark to 0 if 0 is passed', function() {
        var p = Param();
        var p2 = Param();

        var e = Expression.createOperation('+',
          Expression.createParameter(p),
          Expression.createParameter(p2)
        );

        e.mark(10);
        eq(p.mark, 10);
        eq(p2.mark, 10);

        e.mark(0);
        eq(p.mark, 0);
        eq(p2.mark, 0);
      });

      it('adds the incoming delta to the existing value', function() {
        var p = Param();

        var e = Expression.createOperation('+',
          Expression.createParameter(p),
          Expression.createConstant(5)
        );

        e.mark(10);
        eq(p.mark, 10);

        e.mark(10);
        eq(p.mark, 20);
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

    describe('#reset', function() {
      it('resets the subsystem', function() {
        var a = Expression.createConstant(10);
        a.reset();
        eq(a.subsystem, -1);
      });
    });

    describe('#countUnknowns', function() {
      it('counts the number of unsolved variables', function() {

        var p = Param();

        var e = Expression.createOperation('+',
          Expression.createParameter(p),
          Expression.createConstant(5)
        );


        eq(e.countUnknowns(), 1);
      });
    });
  });
});
