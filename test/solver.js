if (typeof require !== "undefined") {
  var Solver = require("../lib/solver.js");
  var Expression = require("../lib/expression.js");
  var Param = require("../lib/param.js");
}

var ok = function(a, msg) { if (!a) throw new Error(msg || "not ok"); };
var eq = function(a, b) { if (a!==b) throw new Error(a + " !== " + b); };

describe('Solver', function() {
  describe('#markUnknowns', function() {
    it('marks all variables unknown', function() {
      var e = Expression.createParameter(Param(10));
      e.unknown();
      ok(!e.param.known);
    });
  });

  describe('#forwardSubstitute', function() {
    it('reduces a single expression to a noop', function() {

      var p = Param();
      var p2 = Param();

      var e = Expression.createOperation('-',
        Expression.createParameter(p),
        Expression.createParameter(p2)
      );

      var solver = new Solver();
      var eqs = solver.forwardSubstitute([e]);

      eq(eqs.length, 0);
    });

    it('replaces parameters in other expressions', function() {

      var p = Param(1);
      var p2 = Param(2);

      var e = Expression.createOperation('-',
        Expression.createParameter(p),
        Expression.createParameter(p2)
      );

      var e2 = Expression.createOperation('-',
        Expression.createConstant(5),
        Expression.createParameter(p2)
      );

      var solver = new Solver();
      var eqs = solver.forwardSubstitute([e, e2]);

      eq(eqs.length, 1);

      eq(eqs[0].toString(), '(5 - {1})');
    });

    it('replaces b with a when b is a reference to editor entities', function() {
      var p = Param(1);
      var p2 = Param(2);

      p2.reference = true;

      var e = Expression.createOperation('-',
        Expression.createParameter(p),
        Expression.createParameter(p2)
      );

      var e2 = Expression.createOperation('-',
        Expression.createConstant(p2),
        Expression.createParameter(5)
      );

      var solver = new Solver();
      var eqs = solver.forwardSubstitute([e, e2]);

      eq(eqs.length, 1);

      eq(eqs[0].toString(), '({2} - 5)');
    });

    it('replaces b with a when b is a reference to editor entities', function() {
      var p = Param(1);
      var p2 = Param(2);

      p2.reference = true;

      var e = Expression.createOperation('-',
        Expression.createParameter(p),
        Expression.createParameter(p2)
      );

      var e2 = Expression.createOperation('-',
        Expression.createConstant(p2),
        Expression.createParameter(5)
      );

      var solver = new Solver();
      var eqs = solver.forwardSubstitute([e, e2]);

      eq(eqs.length, 1);

      eq(eqs[0].toString(), '({2} - 5)');
    });
  });

  describe('#solveSubsystem', function() {
    it('', function() {

    });
  });

  describe('#solve', function() {
    it('', function() {

    });
  });

});
