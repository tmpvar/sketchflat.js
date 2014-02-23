
if (typeof require !== "undefined") {
   var Constraint = require("../lib/constraint.js");
   var Param = require("../lib/param.js");
   var Vec2 = require('vec2');
}

var ok = function(a, msg) { if (!a) throw new Error(msg || "not ok"); };
var eq = function(a, b) { if (a!==b) throw new Error(a + " !== " + b); };

describe('Constraint', function() {
  describe('constructor', function() {
    it('creates a constraint', function() {
      var s = new Constraint('pt-pt-distance');
      eq(typeof s.value, 'function');
      eq(s.type, 'pt-pt-distance');
    });

    it('is callable without new', function() {
      var s = Constraint();
      eq(typeof s.value, 'function');
    });
  });

  describe('Instance Methods', function() {
    describe('#value', function() {
      it('acts like a getter/setter', function() {
        var c = Constraint();
        c.value(10);
        eq(c.value(), 10);
      });

      it('solves the sketch if attached', function() {
        var c = Constraint();
        var calls = 0;
        c.sketch = { solve: function() { calls++; } };

        c.value(10);
        eq(calls, 1);
      });
    });

    describe('addEquation', function() {
      it('adds an item to the equations array', function() {
        var c = Constraint();
        eq(c.equations.length, 0);
        c.addEquation({});
        eq(c.equations.length, 1);
      });
    });
  });

  describe('Constraint Methods', function() {
    describe('Constraint.createDistance', function() {
      it('maintains distance between two points', function() {
        var e = Constraint.createDistance(Vec2(0, 0), Vec2(10, 0));
        eq(e.evaluate(), 10);
      });

      it('maintains distance between a point and line', function() {
        var e = Constraint.createDistance(Vec2(0, 5), {
          start : Vec2(10, 0),
          end : Vec2(10, 10)
        });

        eq(e.evaluate(), 10);
      });

      it('maintains distance between a point and line', function() {
        var e = Constraint.createDistance({
          start : Vec2(10, 0),
          end : Vec2(10, 10)
        }, Vec2(0, 5));

        eq(e.evaluate(), 10);
      });

      it('maintains distance between a line and line', function() {
        var e = Constraint.createDistance(
          { start: Vec2(0, 0), end: Vec2(0, 10) },
          { start : Vec2(10, 0), end : Vec2(10, 10) }
        );

        eq(e.evaluate(), 10);
      });
    });
  });
});

