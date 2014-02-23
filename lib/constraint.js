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

Constraint.createDistance = function(v1, v2) {

  // line and line
  if (v1.end && v2.end) {
   return Constraint.createDistanceFromPointToLine(v1.start, v2);

  // point to line
  } else if (v2.end) {
    return Constraint.createDistanceFromPointToLine(v1, v2);

  } else if (v1.end) {
    return Constraint.createDistanceFromPointToLine(v2, v1);

  } else {

    return eOp('sqrt',
      eOp('+',
        eOp('square', eOp('-',
          eParam(Param.fromObject(v1, 'x')),
          eParam(Param.fromObject(v2, 'x')))
        ),
        eOp('square', eOp('-',
          eParam(Param.fromObject(v1, 'y')),
          eParam(Param.fromObject(v2, 'y')))
        )
      )
    );
  }
};

module.exports = Constraint;

