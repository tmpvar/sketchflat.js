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

module.exports = Param;