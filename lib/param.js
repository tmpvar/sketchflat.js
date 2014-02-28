function Param(value) {

  if (!(this instanceof Param)) {
    return new Param(value);
  }

  this.id = Param.id++;
  this.value(value);
}

Param.id = 0;

Param.prototype.mark = 0;
Param.prototype.known = false;
Param.prototype.reference = false;
Param.prototype.assumed = false;
Param.prototype.assumedLastTime = false;
Param.prototype.substituted = false;

Param.prototype.toString = function() {
  if (this.known) {
    return '{' + this.value() + '}';
  } else {
    return '{#' + this.id + '}';
  }
};

Param.prototype.value = function(val) {
  if (typeof val !== 'undefined') {
    this._value = val;
    this.known = true;
  }

  return this._value;
};

Param.fromObject = function(obj, key) {
  if (!obj._paramId) {
    obj._paramId = {};
  }

  if (!obj._paramId[key]) {
    var val = obj[key];
    var p = new Param(val);

    obj._paramId[key] = p
  } else {
    p = obj._paramId[key];
  }

  p.value = function() {
    // TODO: set?
    return obj[key];
  }
  return p;
};

module.exports = Param;