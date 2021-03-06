// integration point between the UI and the math

if (typeof require !== 'undefined') {
  var Solver = require('./solver');
}

function Sketch() {
  if (!(this instanceof Sketch)) {
    return new Sketch();
  }

  this.solver = new Solver(this);
  this.constraints = [];
}

Sketch.prototype.dirty = false;


Sketch.prototype.addConstraint = function(constraint) {
  this.constraints.push(constraint);

  this.dirty = true;

  this.solver.solve();

  return this;
}

Sketch.prototype.removeConstraint = function(constraint) {
  this.constraints = this.constraints.filter(function(a) {
    return a!==constraint;
  });

  this.dirty = true;

  this.solver.solve();

  return this;
};

Sketch.prototype.solve = function() {
  this.solver.solve();
};

module.exports = Sketch;