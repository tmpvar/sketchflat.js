var log = console.log;

if (typeof require !== 'undefined') {
  var Expression = require('./expression');
}

function Solver(sketch, debug) {
  this.sketch = sketch;

  this.savedParams = [];
  this.debug = !!debug;
}

Solver.prototype.solve = function(eqs) {
  if (!eqs && this.sketch && this.sketch.constraints) {
    eqs = [];
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
  }

  if (eqs.length) {
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

Solver.prototype.collectUnknowns = function(equations, extra, onlyMarked) {
  var unknowns = [];
  for (var i=0; i<equations.length; i++) {
    equations[i].collectUnknowns(onlyMarked, unknowns);
  }

  if (extra) {
    extra.collectUnknowns(onlyMarked, unknowns);
  }

  var seen = {};
  return unknowns.filter(function(unknown) {
    if (!seen[unknown.id]) {
      seen[unknown.id] = { count : 1, param : unknown };
      return true;
    } else {
      seen[unknown.id].count++;
      return false;
    }
  });


  return unknowns;
};

var printMatrix = function(matrix, label) {
  console.log('\n', label || '')
  matrix.forEach(function(row) {
    console.log('|', row.join(', '), '|');
  });
  console.log('')
};


Solver.prototype.solveLinearSystem = function(matrix, fns) {

    // Gaussian elimination, with partial pivoting. It's an error if the
    // matrix is singular, because that means two constraints are
    // equivalent.
    var i, j, ip, jp, imax;
    var max, temp, N = fns.length, result = [];

    for(i = 0; i < N; i++) {
        // We are trying eliminate the term in column i, for rows i+1 and
        // greater. First, find a pivot (between rows i and N-1).
        max = 0;
        for(ip = i; ip < N; ip++) {
            if(Math.abs(matrix[ip][i]) > max) {
                imax = ip;
                max = Math.abs(matrix[ip][i]);
            }
        }
        if(Math.abs(max) < 1e-12) return console.log('max:', max);

        // Swap row imax with row i
        for(jp = 0; jp < N; jp++) {
            temp = matrix[i][jp];
            matrix[i][jp] = matrix[imax][jp];
            matrix[imax][jp] = temp;
        }
        temp = fns[i];
        fns[i] = fns[imax];
        fns[imax] = temp;

        // For rows i+1 and greater, eliminate the term in column i.
        for(ip = i+1; ip < N; ip++) {
            temp = matrix[ip][i]/matrix[i][i];

            for(jp = 0; jp < N; jp++) {
                matrix[ip][jp] -= temp*(matrix[i][jp]);
            }
            fns[ip] -= temp*fns[i];
        }
    }

    printMatrix(matrix, 'triangular');

    // We've put the matrix in upper triangular form, so at this point we
    // can solve by back-substitution.
    for(i = N - 1; i >= 0; i--) {
        if(Math.abs(matrix[i][i]) < 1e-10) return false;

        temp = fns[i];
        for(j = N - 1; j > i; j--) {
            temp -= result[j]*matrix[i][j];
        }
        result[i] = temp / matrix[i][i];
    }

    return result;

}

Solver.prototype.solveSubsystem = function(constraintEquations) {

  // TODO: Load previous results to speed up this computation

  // Compare the # of expressions to the # of unknowns
  constraintEquations = constraintEquations.filter(function(eq) {
    return eq && eq.subsystem < 0;
  }).map(function(eq) {
    return eq.evaluateKnown().mark(1);
  });

  var l = constraintEquations.length;
  var unknownArray = this.collectUnknowns(constraintEquations);
  var unknowns = unknownArray.length;

  if (!unknowns) {
    return console.log('there are no unknowns in this system');
  } else if (l > unknowns) {
    console.log('WARNING: not enough unknowns?', l, '>',unknowns)
    console.log(unknownArray)
    //return false;
  }

  // Break the equations up into subsystems to be solved
  // independently
  var subsystems = [], subsystem = [], eqs = constraintEquations.concat();
  for (var i = l-1; i >=0 ; i--) {

    var subsystemUnknowns = this.collectUnknowns(subsystem, eqs[i], true).length;
    console.log('(' + i + ') SUBSYSTEM COLLECTOR:', subsystem.length, subsystemUnknowns)
    var subsystemLength = subsystem.length;
    console.log('unknowns: %d, eqs: %d', subsystemUnknowns, subsystem.length)
    if (subsystemLength+1 === subsystemUnknowns) {
      console.log('subsystem equations\n  ', subsystem.join('\n  '), '\n');

      subsystem.push(eqs[i]);

      console.log('EXACTLY', subsystem.length, this.collectUnknowns(subsystem, eqs[i], true));

      // Exactly constrained
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

  if (subsystem.length) {

    if (subsystem.length !== subsystemUnknowns) {
      console.log('LAST SUBSYSTEM IS UNDERDEFINED', subsystem.map(function(s) {
        return s.collectUnknowns(true).map(function(u) {

          return '#' + u.id + ':' + u.value()
        })
      }), subsystem.length, subsystemUnknowns, eqs.length);
    }

    subsystems.push(subsystem);
  }
console.log('FOUND', subsystems.length, 'SUBSYSTEMS')
  var solver = this;
  subsystems.reverse().map(function(s) {

    var unknowns = solver.collectUnknowns(s, null, true);
    console.log('unknowns', unknowns.length, s.length);

    // Build jacobian matrix
    var matrix = [], row;
    for (var i = 0; i<s.length; i++) {
      row = [];
      for (var j = 0; j<s.length; j++) {

        if (s[i].independentOf(unknowns[j])) {
          row.push(Expression.createConstant(0));
        } else {

          var p = s[i].partial(unknowns[j]);
          row.push(p);
        }
      }
      matrix.push(row);
    }

    var iterations = 10;
    while(iterations--) {

      // solve original equations
      var fns = s.map(function(system) {
        return system.evaluate();
      });

      var gauss = []
      for (var i = 0; i<matrix.length; i++) {
        var row = [];
        for (var j = 0; j<matrix[i].length; j++) {
          row.push(matrix[i][j].evaluate ? matrix[i][j].evaluate() : matrix[i][j]);
        }

        gauss.push(row);
      }

      printMatrix(gauss, 'gauss');
      console.log(fns)
      var results = solver.solveLinearSystem(gauss, fns);

      console.log('results:', results, fns)

      if (results) {

        unknowns.forEach(function(param, idx) {
          var v = param.value() - 0.98 * results[idx]
          //v -= results[idx]
          console.log('#' + param.id, '=', param.value(), 'new =', results[idx], '[known=' + param.known + ']')
          param.value(v);
        });

        console.log('RESULTS', results);
      } else {
        console.log('WTF', unknowns, fns);
        unknowns.forEach(function(param, idx) {
          param.value(param.value() - fns[idx]);
        });

      }

      console.log('FNS:', fns);
      if (!fns.filter(Boolean).length) {
        console.log('CONVERGANCE', iterations);
        return;
      }
    }
  });

  return true;
};

module.exports = Solver;
