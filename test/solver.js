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
});
