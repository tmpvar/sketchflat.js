if (typeof require !== "undefined") {
   var Param = require("../lib/param.js");
}

var ok = function(a, msg) { if (!a) throw new Error(msg || "not ok"); };
var eq = function(a, b) { if (a!==b) throw new Error(a + " !== " + b); };

describe('Param', function() {
  describe('constructor', function() {
    it('sets value', function() {
      var p = Param(10);
      eq(p.value(), 10);
      eq(p.known,  true);
    });

    it('leaves known if no value', function() {
      var p = Param();
      eq(p.known, false);
    });

    it('sets the id of this param', function() {
      var p = Param();
      ok(p.id > 0);
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
    it('stringifies (known)', function() {
      eq(Param(10).toString(), '{10}');
    });

    it('stringifies (unknown)', function() {
      var p = Param();
      eq(p.toString(), '{#' + p.id + '}');
    })
  });

  describe('#fromObject', function() {
    it('rewrites .value', function() {
      var obj = { x : 10 };
      var p = Param.fromObject(obj, 'x');

      eq(p.value(), 10);
      obj.x = 100;
      eq(p.value(), 100);

    });
  });

});
