function Param(value) {

  if (!(this instanceof Param)) {
    return new Param(value);
  }

  this.value = function(val) {
    if (typeof val !== 'undefined') {
      value = val;
    }

    return value;
  };

  this.toString = function() {
    return '{' + this.value() + '}';
  }
}

module.exports = Param;