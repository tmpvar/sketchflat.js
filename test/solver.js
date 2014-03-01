if (typeof require !== "undefined") {
  var Solver = require("../lib/solver.js");
  var Expression = require("../lib/expression.js");
  var Constraint = require('../lib/constraint');
  var Vec2 = require('vec2');
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
    it('returns false if there are more equations than unknowns', function() {
      var e = Expression.createOperation('-',
        Expression.createConstant(5),
        Expression.createConstant(2)
      );

      var e2 = Expression.createOperation('-',
        Expression.createConstant(5),
        Expression.createConstant(Param())
      );

      var solver = new Solver();

      ok(!solver.solveSubsystem([e, e2]));
    });

    it('returns false if there are no unknowns', function() {
      var e = Expression.createOperation('-',
        Expression.createConstant(5),
        Expression.createConstant(5)
      );

      var solver = new Solver();

      ok(!solver.solveSubsystem([e]));
    });


    it('solves a really basic situation', function() {

      var p = Param(1);
      var p2 = Param(2);

      p2.reference = true;

      var e = Expression.createOperation('-',
        Expression.createParameter(p),
        Expression.createConstant(2)
      ).unknown();

      var e2 = Expression.createOperation('*',
        Expression.createConstant(2),
        Expression.createParameter(p2)
      ).unknown();

      var solver = new Solver();
      var r = solver.solveSubsystem([e, e2]);
      console.log(r);

    });

    it('maintains distance of moved point', function() {

      var p = Vec2(10, 0);
      var origin = Vec2(0, 0);

      var x = Expression.createConstant(p.x);
      var y = Expression.createConstant(p.y);

      var eqs = [
        Expression.createOperation('-',
          Expression.createParameter(Param.fromObject(p, 'y')),
          x
        ).unknown().mark(0),

        Expression.createOperation('-',
          Expression.createParameter(Param.fromObject(p, 'y')),
          y
        ).unknown().mark(0),

        Expression.createOperation('-',
          Constraint.createDistance(p, origin, false, true),
          Expression.createConstant(10)
        ),
      ];

      console.log(eqs[0].collectUnknowns());

      var solver = new Solver();


      [
        [0, 30],
        [0, -30],
        [10, 10],
      ].forEach(function(row) {

        eqs[0].unknown().mark(0);
        eqs[1].unknown().mark(0);

        p.fromArray(row);
        solver.solve(eqs);
        console.log(p.toString())
        eq(p.distance(Vec2(0, 0)), 10);
      });
    });

    it('solves coincidence on a line', function() {

      var line = {
        start: Vec2(0, 1),
        end: Vec2(10, 1)
      };

      var starty = Expression.createConstant(line.start.y);
      var startx = Expression.createConstant(line.start.x);

      var endy = Expression.createConstant(line.end.y);
      var endx = Expression.createConstant(line.end.x);

      var distance = Expression.createConstant(10);

      var subsystem = [
        // Lets simulate a drag of the start point
        Expression.createOperation('-',
          Expression.createParameter(Param.fromObject(line.end, 'x')),
          endx
        ).unknown().mark(0),

        Expression.createOperation('-',
          Expression.createParameter(Param.fromObject(line.end, 'y')),
          endy
        ).unknown().mark(0),

        Expression.createOperation('-',
          Expression.createParameter(Param.fromObject(line.start, 'x')),
          startx
        ).unknown().mark(0),

        Expression.createOperation('-',
          Expression.createParameter(Param.fromObject(line.start, 'y')),
          starty
        ).unknown().mark(0),

        Expression.createOperation('-',
          Constraint.createDistance(line.start, line.end),
          distance
        ),

        Expression.createOperation('-',
          Constraint.createDistance(line.start, Vec2(0, 0), false, true),
          Expression.createConstant(1)
        ),

        Constraint.createHorizontal(line).unknown().mark(0)
      ];

      var olength = line.start.distance(line.end);
      var oorgin = line.start.distance(Vec2(0, 0));


      var solver = new Solver();

      line.start.set(-1, 0);
      console.log(startx);

      var r = solver.solve(subsystem);
      console.log(r, line.start + ' -> ' + line.end)

      eq(olength, line.start.distance(line.end))
      eq(oorgin, line.start.distance(Vec2(0, 0)))


    });
  });

  describe('#solve', function() {
    it('', function() {

    });
  });

});
