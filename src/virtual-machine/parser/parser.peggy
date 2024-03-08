// Utility functions to help in parsing.
{{
  // Converts a Golang string representing an integer (in the given base) to the integer.
  function parseInteger(integer, base) {
    // Golang integers can be underscore delimited.
    const value = parseInt(integer.replace("_", ""), base)
    return {
      type: 'integer_literal',
      value: value
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
int_lit = number:binary_lit  { return parseInteger(number, 2) } /
          number:octal_lit   { return parseInteger(number, 8) } /
          number:decimal_lit { return parseInteger(number, 10) } /
          number:hex_lit     { return parseInteger(number, 16) } 
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
//! TODO: This thing is not parsed into JS floats at all.
float_lit = decimal_float_lit / hex_float_lit

decimal_float_lit = decimal_digits "." decimal_digits? decimal_exponent /
                    decimal_digits decimal_exponent /
                    "." decimal_digits decimal_exponent?
decimal_exponent  = [eE] ("+" / "-")? decimal_digits

hex_float_lit     = "0" [xX] hex_mantissa hex_exponent
hex_mantissa      = "_"? hex_digits "." hex_digits? /
                    "_"? hex_digits /
                    "." hex_digits
hex_exponent      = [pP] ("+" / "-")? decimal_digits


// =============== Operators ===============
Expression = left:UnaryExpr op:binary_op right:Expression { return op(left, right) } /
             UnaryExpr
UnaryExpr  = PrimaryExpr /
             op:unary_op expr:UnaryExpr { return op(expr) }

// Operators are parsed into a function, that can be applied on operands to construct a token.
binary_op  = "||" { return makeOperator("logical_or") } /
             "&&" { return makeOperator("logical_and") } /
             rel_op / add_op / mul_op
rel_op     = "==" { return makeOperator("equal") } /
             "!=" { return makeOperator("not_equal") } /
             "<" { return makeOperator("less_than") } /
             "<=" { return makeOperator("less_than_or_equal") } /
             ">" { return makeOperator("greater_than") } /
             ">=" { return makeOperator("greater_than_or_equal") }
add_op     = "+" { return makeOperator("add") } /
             "-" { return makeOperator("subtract") } /
             "|" { return makeOperator("bitwise_or") } /
             "^" { return makeOperator("bitwise_xor") }
mul_op     = "*" { return makeOperator("multiply") } /
             "/" { return makeOperator("divide") } /
             "%" { return makeOperator("modulo") } /
             "<<" { return makeOperator("bitwise_left_shift") } /
             ">>" { return makeOperator("bitwise_right_shift") } /
             "&" { return makeOperator("bitwise_and") } /
             "&^" { return makeOperator("???") } //! TODO: Find out what this is

unary_op   = "+" { return makeOperator("plus") } /
             "-" { return makeOperator("minus") } /
             "!" { return makeOperator("not") } /
             "^" { return makeOperator("bitwise_not") } /
             "*" { return makeOperator("???") } / //! TODO: Add this operator.
             "&" { return makeOperator("???") } / //! TODO: Add this operator.
             "<-" { return makeOperator("???") }  //! TODO: Add this operator.


// Primary Expressions (Partial)
//! TODO: Add support for all primary expressions instead of numerical.
PrimaryExpr = int_lit / float_lit