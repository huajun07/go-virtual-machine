// Utility functions to help in parsing.
{{
  // Converts a Golang string representing an integer (in the given base) to a JS integer.
  function makeInteger(integer, base) {
    // Golang integers can be underscore delimited.
    const value = parseInt(integer.replace("_", ""), base)
    return {
      type: 'integer_literal',
      value: value,
    }
  }

  // Converts a Golang string representing a float to a JS float.
  function makeFloat(float) {
    const value = parseFloat(float)
    return {
      type: 'float_literal',
      value: value,
    }
  }

  // Returns a function that can be applied on operands, to construct a token.
  function makeOperator(operator_name) {
    return (...args) => {
      return {
        type: operator_name,
        children: args,
      }
    }
  }
}}

/*
The parser will return a tree structure, where every operation has a type,
some (or none) children, and possibly a value.

For example, a binary multiplication operation looks like this:
{
    type: 'binary_multiplication',
    children: [...]
}

An integer literal looks like this:
{
    type: 'integer_literal',
    value: 42
}
*/

// =============== Root ===============
start = Expression

// =============== Characters ===============
decimal_digit = [0-9]
binary_digit  = [0-1]
octal_digit   = [0-7]
hex_digit     = [0-9a-fA-F]


// =============== Integer Literals ===============
int_lit = number:binary_lit  { return makeInteger(number, 2) } /
          number:octal_lit   { return makeInteger(number, 8) } /
          number:decimal_lit { return makeInteger(number, 10) } /
          number:hex_lit     { return makeInteger(number, 16) } 
binary_lit  = "0" "b" "_"? $binary_digits
octal_lit   = "0" [oO]? "_"? $octal_digits
decimal_lit = $([1-9] "_"? decimal_digits?) /
              "0"
hex_lit     = "0" [xX] "_"? $hex_digits

binary_digits  = binary_digit  ("_"? binary_digit)*
octal_digits   = octal_digit   ("_"? octal_digit)*
decimal_digits = decimal_digit ("_"? decimal_digit)*
hex_digits     = hex_digit     ("_"? hex_digit)*


// =============== Floating-point Literals ===============
float_lit = number:$decimal_float_lit { return makeFloat(number); }

decimal_float_lit = decimal_digits "." decimal_digits? decimal_exponent? /
                    decimal_digits decimal_exponent /
                    "." decimal_digits decimal_exponent?
decimal_exponent  = [eE] ("+" / "-")? decimal_digits


// =============== Operators ===============
Expression = left:UnaryExpr op:binary_op right:Expression { return op(left, right) } /
             UnaryExpr
UnaryExpr  = PrimaryExpr /
             op:unary_op expr:UnaryExpr { return op(expr) }

// Operators are parsed into a function, that can be applied on operands to construct a token.
binary_op  = "||" { return makeOperator("conditional_or") } /
             "&&" { return makeOperator("conditional_and") } /
             rel_op / add_op / mul_op
rel_op     = "==" { return makeOperator("equal") } /
             "!=" { return makeOperator("not_equal") } /
             "<" { return makeOperator("less") } /
             "<=" { return makeOperator("less_or_equal") } /
             ">" { return makeOperator("greater") } /
             ">=" { return makeOperator("greater_or_equal") }
add_op     = "+" { return makeOperator("sum") } /
             "-" { return makeOperator("difference") } /
             "|" { return makeOperator("bitwise_or") } /
             "^" { return makeOperator("bitwise_xor") }
mul_op     = "*" { return makeOperator("product") } /
             "/" { return makeOperator("quotient") } /
             "%" { return makeOperator("remainder") } /
             "<<" { return makeOperator("left_shift") } /
             ">>" { return makeOperator("right_shift") } /
             "&" { return makeOperator("bitwise_and") } /
             "&^" { return makeOperator("bit_clear") }

unary_op   = "+" { return makeOperator("plus") } / // Note: This operator is unnamed in Golang specs.
             "-" { return makeOperator("negation") } /
             "!" { return makeOperator("not") } /
             "^" { return makeOperator("bitwise_complement") } /
             "*" { return makeOperator("indirection") } /
             "&" { return makeOperator("address") } /
             "<-" { return makeOperator("receive") }


// Primary Expressions (Partial)
//! TODO: Add support for all primary expressions instead of numerical.
PrimaryExpr = float_lit / int_lit 