var log = console.log;

function Solver(sketch, debug) {
  this.sketch = sketch;

  this.savedParams = [];
  this.debug = !!debug;
}

Solver.prototype.solve = function() {
  var eqs = [];
  if (this.sketch && this.sketch.constraints) {

    // Collect all expressions
    this.sketch.constraints.forEach(function(constraint) {
      if (constraint && constraint.equations) {
        equations.forEach(function(eq) {
          // Mark unknowns
          eq.unknown();
          eq.reset();
          eqs.push(eq);
        });
      }
    });

    // Solve by forward substitution
    this.forwardSubstitute(eqs);

    // Solve subsystem starting at index 0
    this.solveSubsystem();

    //  - use this.savedParams to save some time
    // Save good params
    //  - store in this.savedParams
  }
};


Solver.prototype.forwardSubstitute = function(constraintEquations) {

  var expressions = constraintEquations.map(function(ex) {
    return ex.clone();
  });

  var l = expressions.length, e, params, ret = [];

  for (var i = 0; i<l; i++) {
    e = expressions[i];

    params = e.marksTwoParamsEqual();

    if (params) {

      // If the current param is a reference parameter
      // do not allow it to be solved for. Think x axis, y-axis, origin, etc..
      if (params[0].reference) {
        params = params.reverse();
      }

      for (var j = 0; j<l; j++) {
        expressions[j].replaceParameter(params[0], params[1]);
      }

    } else {
      ret.push(e);
    }
  }
  return ret;
};

Solver.prototype.solveSubsystem = function(id) {

};

module.exports = Solver;