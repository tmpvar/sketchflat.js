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

Expression.prototype.operator = null;
Expression.prototype.e0 = null;
Expression.prototype.e1 = null;
Expression.prototype.param = null;
Expression.prototype.value = null;

// returns another expression
Expression.prototype.evalKnown = function() {

}

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

// return undefined
Expression.prototype.mark = function(delta) {

}


Expression.prototype.replaceParameter = function(replacement, toReplace) {

};

// returns boolean
Expression.prototype.marksTwoParamsEqual = function(paramA, paramB) {

};

// returns double
Expression.prototype.evaluate = function() {
  var e0 = this.e0, e1 = this.e1;

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
      throw new Error('Unhandled operator:' +  op);
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


Expression.createParameter = function(param) {
  return new Expression('parameter', null, null, param, 0);
};

Expression.createConstant = function(value) {
  return new Expression('constant', null, null, null, value);
};

Expression.createOperation = function(op, e0, e1) {
  return new Expression(op, e0, e1);
};


module.exports = Expression;