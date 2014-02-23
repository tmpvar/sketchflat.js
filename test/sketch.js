
if (typeof require !== "undefined") {
   var Sketch = require("../lib/sketch.js");
}

var ok = function(a, msg) { if (!a) throw new Error(msg || "not ok"); };
var eq = function(a, b) { if (a!==b) throw new Error(a + " !== " + b); };

describe('Sketch', function() {
  describe('constructor', function() {
    it('creates a constraint and entity lists', function() {
      var s = new Sketch();
      eq(s.constraints.length, 0);
    });

    it('is callable without new', function() {
      var s = Sketch();
      eq(s.constraints.length, 0);
    });

    it('creates a solver instance', function() {
      var s = Sketch();
      ok(s.solver);
      eq(s.solver.sketch, s);
    });
  });

  describe('#addConstraint', function() {
    it('adds to the constraint array', function() {
      var s = new Sketch();

      eq(s.constraints.length, 0);
      s.addConstraint({});
      eq(s.constraints.length, 1);
    });

    it('chains', function() {
      var s = Sketch();
      eq(s.addConstraint(), s);
    });
  });

  describe('#removeConstraint', function() {
    it('removes the specified constraint', function() {
      var s = new Sketch();
      s.addConstraint(1).removeConstraint(1);
      eq(s.constraints.length, 0);
    });

    it('chains', function() {
      var s = Sketch();
      eq(s.removeConstraint(), s);
    });
  });
});
