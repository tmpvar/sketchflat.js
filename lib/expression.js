if (typeof require !== 'undefined') {
  var Param = require('./param');
}


function Expression(op, e0, e1, param, value) {
  if (!(this instanceof Expression)) {
    return new Expression(op, e0, e1, param, value);
  }

  this.op    = op    || this.op;
  this.e0    = e0    || this.e0;
  this.e1    = e1    || this.e1;
  this.param = param || this.param;
  this.value = (typeof value === 'undefined') ? this.value : value;
}

Expression.prototype.op = null;
Expression.prototype.e0 = null;
Expression.prototype.e1 = null;
Expression.prototype.param = null;
Expression.prototype.value = null;
Expression.prototype.subsystem = -1;

Expression.prototype.reset = function() {
  this.subsystem = -1;
};

Expression.prototype.unknown = function() {
  if (this.e0) {
    this.e0.unknown();
  }

  if (this.e1) {
    this.e1.unknown();
  }

  if (this.op === 'parameter' && !this.param.reference) {
    this.param.known = false;
  }

  return this;
};

Expression.prototype.countUnknowns = function(mark) {
  var res = 0;
  if (this.e0) {
    res += this.e0.countUnknowns(mark);
  }

  if (this.e1) {
    res += this.e1.countUnknowns(mark);
  }

  if (this.op === 'parameter' && !this.param.known) {
    if (!mark || this.param.mark > 0) {
      res++;
    }
  }

  return res;
};

Expression.prototype.collectUnknowns = function(mark, result) {
  result = result || [];

  if (this.e0) {
    this.e0.collectUnknowns(mark, result);
  }

  if (this.e1) {
    this.e1.collectUnknowns(mark, result);
  }

  if (this.op === 'parameter' && !this.param.known) {
    if (!mark || this.param.mark > 0) {
      result.push(this.param);
    }
  }

  return result;
};

// Return the symbolic partial derivative of the given expression, with
// respect to the parameter param.
Expression.prototype.partial = function(param) {

  switch (this.op) {
    case 'parameter':
      if (this.param === param) {
        return Expression.createConstant(1);
      } else {
        return Expression.createConstant(0);
      }

    case 'constant':
      return Expression.createConstant(0);

    case '+':
    case '-':
      return Expression.createOperation(
        this.op, this.e0.partial(param), this.e1.partial(param)
      );

    case '*':
      var p0 = this.e0.partial(param);
      var p1 = this.e1.partial(param);

      return Expression.createOperation('+',
        Expression.createOperation('*', this.e0, p1),
        Expression.createOperation('*', this.e1, p0)
      );

    case '/':
      var p0 = this.e0.partial(param);
      var p1 = this.e1.partial(param);

      return Expression.createOperation('/',
        Expression.createOperation('-',
          Expression.createOperation('*', this.e1, p0),
          Expression.createOperation('*', this.e0, p1)
        ),
        Expression.createOperation('square', this.e1)
      );

    case 'negate':
      return Expression.createOperation('negate', this.e0.partial(param))

    case 'sqrt':
      return Expression.createOperation('*',
        Expression.createOperation('/',
          Expression.createConstant(0.5),
          Expression.createOperation('sqrt', this.e0)
        ),
        this.e0.partial(param)
      );

    case 'square':
      return Expression.createOperation('*',
        Expression.createOperation('*',
          Expression.createConstant(2),
          this.e0
        ),
        this.e0.partial(param)
      );

    case 'sin':
      return Expression.createOperation('*',
        Expression.createOperation('cos',
          this.e0
        ),
        this.e0.partial(param)
      );

    case 'cos':

      return Expression.createOperation('negate',
        Expression.createOperation('*',
          Expression.createOperation('sin',
            this.e0
          ),
          this.e0.partial(param)
        )
      )

    default:
      throw new Error('Unhandled operator: ' +  this.op);
  }
};

// Is an expression entirely independent of param? This is a useful
// optimisation, because it saves calculating and evaluating trivial
// partial derivatives.
Expression.prototype.independentOf = function(param) {
  switch (this.op) {
    case 'constant':
      return true;

    case 'parameter':
      return param !== this.param;

    case '+':
    case '-':
    case '*':
    case '/':
      return this.e0.independentOf(param) && this.e1.independentOf(param);

    case 'sqrt':
    case 'square':
    case 'negate':
    case 'sin':
    case 'cos':
      return this.e0.independentOf(param);

    default:
      throw new Error('Unhandled operator: ' + this.op);
  }
};

// Adjust all of the SK->param[i].mark terms by the given delta
Expression.prototype.mark = function(delta) {

  if (this.op === 'parameter') {
    if (delta === 0) {
      this.param.mark = delta;
    } else {
      this.param.mark+=delta;
    }
  }

  if (this.e0) {
    this.e0.mark(delta);
  }

  if (this.e1) {
    this.e1.mark(delta);
  }

  return this;
};

Expression.prototype.replaceParameter = function(replacement, toReplace) {

  switch(this.op) {
    case 'constant':
      // noop
    break;

    case 'parameter':
      if (this.param === toReplace) {
        this.param = replacement;
      }
    break;

    case '+':
    case '-':
    case '/':
    case '*':
      this.e0.replaceParameter(replacement, toReplace);
      this.e1.replaceParameter(replacement, toReplace);
    break;

    case 'sqrt':
    case 'square':
    case 'negate':
    case 'sin':
    case 'cos':
      this.e0.replaceParameter(replacement, toReplace);
    break;

    default:
      throw new Error('Unhandled operator: ' +  this.op);
  }

  return this;
};

// returns boolean
Expression.prototype.marksTwoParamsEqual = function() {

  if (this.op !== '-') {
    return false;
  } else if (this.e0.op !== 'parameter' || this.e1.op !== 'parameter') {
    return false;
  }

  return [this.e0.param, this.e1.param];
};

Expression.prototype.isConstant = function() {
  return this.op === 'constant';
};

Expression.prototype.evaluateKnown = function() {
  var e0 = (this.e0) ? this.e0.evaluateKnown() : null;
  var e1 = (this.e1) ? this.e1.evaluateKnown() : null;

  switch (this.op) {
    case 'parameter':
      if (this.param.known) {
        return Expression.createConstant(this.param.value());
      } else {
        return Expression.createParameter(this.param);
      }

    case 'constant':
      return Expression.createConstant(this.value);

    case '+':
    case '-':
    case '*':
    case '/':

      if (e0.isConstant() && e1.isConstant()) {
        return Expression.createConstant(this.evaluate(e0, e1));
      } else if (this.op === '*') {

        if (
          (e0.isConstant() && e0.value === 0) ||
          (e1.isConstant() && e1.value === 0)
        ) {
          return Expression.createConstant(0);
        } else {
          return Expression.createOperation(this.op, e0, e1);
        }

      } else {
        return new Expression(this.op, e0, e1);
      }
    break;

    case 'sqrt':
    case 'square':
    case 'negate':
    case 'sin':
    case 'cos':
      if (e0.isConstant()) {
        return Expression.createConstant(this.evaluate(e0, e1));
      } else {
        return Expression.createOperation(this.op, e0);
      }

    default:
      throw new Error('Unhandled operator: ' +  this.op);
  }
};

// returns double
Expression.prototype.evaluate = function(e0, e1) {
  var e0 = e0 || this.e0, e1 = e1 || this.e1;

  switch (this.op) {

    case 'parameter':
      return this.param.value();
    break;

    case 'constant':
      return this.value;

    case '+':
      return e0.evaluate() + e1.evaluate();

    case '-':
      return e0.evaluate() - e1.evaluate();

    case '*':
      return e0.evaluate() * e1.evaluate();

    case '/':
      return Expression.numDiv(e0.evaluate(), e1.evaluate());

    case 'negate':
      return -e0.evaluate();

    case 'square':
      var v = e0.evaluate();
      return v*v;

    case 'sqrt':
      return Math.sqrt(e0.evaluate());

    case 'sin':
      return Math.sin(e0.evaluate());

    case 'cos':
      return Math.cos(e0.evaluate());

    default:
      throw new Error('Unhandled operator: ' +  this.op);
  }
};

Expression.numDiv = function(a, b) {
  if (b === 0) {
    return Number.MAX_VALUE;
  } else {
    return a / b;
  }
};

Expression.prototype.toString = function() {
  var ret = '', op = this.op;
  switch (this.op) {
    case 'parameter':
      ret += this.param.toString();
    break;

    case 'constant':
      ret +=  this.value;
    break;

    case '+':
    case '-':
    case '*':
    case '/':
      ret += '(' + this.e0 + ' ' + this.op + ' ' + this.e1 + ')'
    break;

    case 'negate':
      op = '-';
    case 'square':
    case 'sqrt':
    case 'sin':
    case 'cos':
      ret += op + '(' + this.e0 + ')';
    break;
  }
  return ret;
};

Expression.prototype.clone = function() {

  var e0 = (this.e0 && this.e0.clone) ? this.e0.clone() : this.e0;
  var e1 = (this.e1 && this.e1.clone) ? this.e1.clone() : this.e1;

  return new Expression(this.op, e0, e1, this.param, this.value);
};

var eParam = Expression.createParameter = function(param) {
  return new Expression('parameter', null, null, param, 0);
};

var eConst = Expression.createConstant = function(value) {
  return new Expression('constant', null, null, null, value);
};

var eOp = Expression.createOperation = function(op, e0, e1) {
  return new Expression(op, e0, e1);
};

Expression.createLineSegmentEquation = function(start, end) {
  var startx = Param.fromObject(start, 'x');
  var starty = Param.fromObject(start, 'y');
  var endx = Param.fromObject(end, 'x');
  var endy = Param.fromObject(end, 'y');

  return [
    eParam(startx),
    eParam(starty),
    eOp('-', eParam(startx), eParam(endx)),
    eOp('-', eParam(starty), eParam(endy)),
  ];
};


module.exports = Expression;