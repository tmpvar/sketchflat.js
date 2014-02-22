if (typeof require !== "undefined") {
   var Param = require("../lib/param.js");
}

var ok = function(a, msg) { if (!a) throw new Error(msg || "not ok"); };
var eq = function(a, b) { if (a!==b) throw new Error(a + " !== " + b); };

describe('Param', function() {
  describe('constructor', function() {
    it('', function() {

    });
  });

  describe('#value', function() {
    it('acts like a getter', function() {
      eq(Param(10).value(), 10);
    });

    it('acts like a setter', function() {
      var p = Param(10);
      eq(p.value(100), 100);
      eq(p.value(), 100);
    });
  });

  describe('#toString', function() {
    it('stringifies', function() {
      eq(Param(10).toString(), '{10}');
    });
  });

});
