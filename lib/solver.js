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
    var reduced = this.forwardSubstitute(eqs);

    // Solve subsystem starting at index 0
    this.solveSubsystem(reduced);

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

Solver.prototype.countUnknowns = function(equations, extra, onlyMarked) {
  var unknowns = 0;
  for (var i=0; i<equations.length; i++) {
    unknowns += equations[i].countUnknowns(onlyMarked);
  }

  if (extra) {
    unknowns += extra.countUnknowns(onlyMarked);
  }

  return unknowns;
};

Solver.prototype.solveSubsystem = function(constraintEquations) {

  // TODO: Load previous results to speed up this computation

  // Compare the # of expressions to the # of unknowns
  constraintEquations = constraintEquations.filter(function(eq) {
    return eq && eq.subsystem < 0;
  }).map(function(eq) {
    return eq.evaluateKnown().mark(1);
  });

  var l = constraintEquations.length;

  var unknowns = this.countUnknowns(constraintEquations);

  if (!unknowns || l > unknowns) {
    return false;
  }

  // Break the equations up into subsystems to be solved
  // independently
  var subsystems = [], subsystem = [], eqs = constraintEquations.concat();
  for (var i = l-1; i >=0 ; i--) {

    var subsystemUnknowns = this.countUnknowns(subsystem, eqs[i], true);

    var subsystemLength = subsystem.length;

    if (subsystemLength === subsystemUnknowns) {
      // Exactly constrained
      subsystem.unshift(subsystemUnknowns);
      subsystem.push(eqs[i]);
      subsystems.push(subsystem);
      subsystem = [];


    } else if (subsystemLength > subsystemUnknowns) {
      console.log('OVERCONSTRAINED:', subsystemLength, subsystemUnknowns);
      // Overconstrained
      throw new Error('TODO: overconstrained');
    } else {
      // Under constrained, try adding more to the subsystem

      // TODO: work on a better way to re-order this array so we can keep searching
      //       for subsystems that are not in a linear order
      //
      //       this should work for contrived examples..

      subsystem.push(eqs[i]);
      eqs.splice(i, 1);
    }
  }

  subsystems.map(function(s) {
    // unknowns are packed at [0]
    var su = s[0];

    // eqs from [1...n]


  });

  console.log(subsystems);

  return true;
};

module.exports = Solver;
