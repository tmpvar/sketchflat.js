if (typeof require !== 'undefined') {
  var Vec2 = require('vec2');
  var Expression = require('./expression');
  var Param = require('./param');
  var eOp = Expression.createOperation;
  var eParam = Expression.createParameter;
  var eConstant = Expression.createConstant;
}

function Constraint(type) {

  if (!(this instanceof Constraint)) {
    return new Constraint();
  }

  this.type = type;
  this.offset = Vec2(50, 0);
  this.equations = [];
}

Constraint.prototype._value = 0;
Constraint.prototype.value = function(val) {
  if (typeof val !== 'undefined') {

    if (this.sketch) {
      this.sketch.solve();
    }

    this._value = val;
  }



  return this._value;
}

Constraint.prototype.addEquation = function(e) {
  this.equations.push(e);
};


Constraint.prototype.ptA = 0;
Constraint.prototype.ptB = 0;
Constraint.prototype.paramA = 0;
Constraint.prototype.paramB = 0;
Constraint.prototype.entityA = 0;
Constraint.prototype.entityB = 0;
Constraint.prototype.lineA = 0;
Constraint.prototype.lineB = 0;
Constraint.prototype.sketch = null;

Constraint.createDistanceFromPointToLine = function(point, line) {
  var a = Expression.createLineSegmentEquation(line.start, line.end);

  var y = Param.fromObject(point, 'y');
  var x = Param.fromObject(point, 'x');

  return eOp('/',
    eOp('-',
      eOp('*', a[2], eOp('-', a[1], eParam(y))),
      eOp('*', a[3], eOp('-', a[0], eParam(x)))
    ),
    eOp('sqrt',
      eOp('+',
        eOp('square', a[2]),
        eOp('square', a[3])
      )
    )
  );
};


// create an equation for:
// * line - line
// * point - line
// * line - point
// * point - point
Constraint.createDistance = function(v1, v2, v1ref, v2ref) {

  // line and line
  if (v1.end && v2.end) {
    return Constraint.createDistanceFromPointToLine(v1.start, v2);

  // point to line
  } else if (v2.end) {
    return Constraint.createDistanceFromPointToLine(v1, v2);

  } else if (v1.end) {
    return Constraint.createDistanceFromPointToLine(v2, v1);

  } else {
    var v1x = Param.fromObject(v1, 'x');
    var v1y = Param.fromObject(v2, 'y');
    if (v1ref) {
      v1x.reference = true;
      v1x.known = true;
      v1y.reference = true;
      v1y.known = true;
    }

    var v2x = Param.fromObject(v2, 'x');
    var v2y = Param.fromObject(v2, 'y');

    if (v2ref) {
      v2x.reference = true;
      v2x.known = true;
      v2y.reference = true;
      v2y.known = true;
    }

    return eOp('sqrt',
      eOp('+',
        eOp('square',
          eOp('-',
            eParam(v1x),
            eParam(v2x)
          )
        ),
        eOp('square',
          eOp('-',
            eParam(v1y),
            eParam(v2y)
          )
        )
      )
    );
  }
};

// Create an expression that forces the two passed lines
// to be equal.
Constraint.createEqualLength = function(line1, line2) {
  return eOp('-',
    Constraint.createDistance(line1.start, line1.end),
    Constraint.createDistance(line2.start, line2.end)
  );
};

// Create an expression to keep the passed line
// vertical
Constraint.createVertical = function(line) {
  return eOp('-',
    eParam(Param.fromObject(line.start, 'x')),
    eParam(Param.fromObject(line.end, 'x'))
  );
};

// Create an expression to keep the passed line
// horizontal
Constraint.createHorizontal = function(line) {
  return eOp('-',
    eParam(Param.fromObject(line.start, 'y')),
    eParam(Param.fromObject(line.end, 'y'))
  );
};

module.exports = Constraint;
