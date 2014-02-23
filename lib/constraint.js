if (typeof require !== 'undefined') {
  var Vec2 = require('vec2');
}

function Constraint() {

  if (!(this instanceof Constraint)) {
    return new Constraint();
  }

  this.offset = Vec2(50, 0);
}

Constraint.prototype.value = 0;
Constraint.prototype.ptA = 0;
Constraint.prototype.ptB = 0;
Constraint.prototype.paramA = 0;
Constraint.prototype.paramB = 0;
Constraint.prototype.entityA = 0;
Constraint.prototype.entityB = 0;
Constraint.prototype.lineA = 0;
Constraint.prototype.lineB = 0;


