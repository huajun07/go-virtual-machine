// Utility functions to help in parsing.
{{
  // Checks whether an identifier is valid (not a reserved keyword).
  function checkIdentifier(identifier) {
    const reserved_keywords = [
      'break', 'case', 'chan', 'const', 'continue', 'default',
      'defer', 'else', 'fallthrough', 'for', 'func', 'go', 'goto',
      'if', 'import', 'interface', 'map', 'package', 'range', 'return',
      'select', 'struct', 'switch', 'type', 'var'
    ]
    return !reserved_keywords.includes(reserved_keywords)
  }

  // Converts a Golang string representing an integer (in the given base) to a JS integer.
  function makeInteger(integer, base) {
    // Golang integers can be underscore delimited.
    const value = parseInt(integer.replace("_", ""), base)
    return {
      type: 'literal',
      value: value,
    }
  }

  // Converts a Golang string representing a float to a JS float.
  function makeFloat(float) {
    const value = parseFloat(float)
    return {
      type: 'literal',
      value: value,
    }
  }

  // Converts a raw string in source code to a JS string.
  function makeRawString(str) {
    // Carriage returns are discarded from raw strings.
    const value = str.replaceAll('\r', '')
    return {
      type: 'literal',
      value: value,
    }
  }

  // Converts an interpreted string in source code to a JS string.
  function makeInterpretedString(str) {
    return {
      type: 'literal',
      value: str,
    }
  }

  // Returns a binary function that can be applied on operands, to construct a token.
  function makeBinaryOperator(operator_name) {
    return (...args) => {
      return {
        type: 'binary_operator',
        name: operator_name,
        children: args,
      }
    }
  }

  // Returns a unary function that can be applied on operands, to construct a token.
  function makeUnaryOperator(operator_name) {
    return (...args) => {
      return {
        type: 'unary_operator',
        name: operator_name,
        children: args,
      }
    }
  }

  // Returns a AST with left to right precedence
  function leftPrecTree(rest, right) {
    if (!rest.length) return right
    let last = rest.pop()
    return last[2](leftPrecTree(rest, last[0]), right)
  }
}}

/*
The parser will return a tree structure, where every operation has a type,
some (or none) children, and possibly a value.

For example, a binary multiplication operation looks like this:
{
    type: 'binary_operator',
    name: 'binary_multiplication',
    children: [...]
}

An integer literal looks like this:
{
    type: 'integer_literal',
    value: 42
}
*/

// =============== Root ===============
start = _ @Expression _


// =============== Whitespace ===============
// By convention, _ is used to eat up whitespace.
_ = [ \t\r\n]*





//* =============== Source Code Representation ===============
//* Characters
newline = "\n"
unicode_char   = char:. &{ return char != "\n" }
unicode_letter = char:. &{ return char.match(/^\p{L}$/u) }
unicode_digit  = char:. &{ return char.match(/^\p{N}$/u) }

//* Letters and Digits
letter        = unicode_letter / "_"
decimal_digit = [0-9]
binary_digit  = [0-1]
octal_digit   = [0-7]
hex_digit     = [0-9a-fA-F]





//* =============== Lexical Elements ===============
//! TODO (P4): Support comments.

//* Identifiers
identifier = iden:letter (letter / unicode_digit)* &{ checkIdentifier(iden) }

//* Integer Literals
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

//* Floating-point Literals
//! TODO (P5): Support hexadecimal floating points.
float_lit = number:$decimal_float_lit { return makeFloat(number); }

decimal_float_lit = decimal_digits "." decimal_digits? decimal_exponent? /
                    decimal_digits decimal_exponent /
                    "." decimal_digits decimal_exponent?
decimal_exponent  = [eE] ("+" / "-")? decimal_digits

//! TODO (P5): Support imaginary literals.
//! TODO (P3): Support rune literals.

//* String Literals
string_lit             = raw_string_lit / interpreted_string_lit
raw_string_lit         = "`" str:$[^`]* "`" { return makeRawString(str) }
interpreted_string_lit = '"' str:$[^\n"]* '"' { return makeInterpretedString(str) }
//! TODO (P3): Interpreted string literals should interpret rune literals.


// =============== Operators ===============
Expression = rest:(ConjExpr _ disjunct_op _)* right:ConjExpr  { return leftPrecTree(rest, right) } /
              ConjExpr
ConjExpr   = rest:(RelExpr _ conjunct_op _)* right:RelExpr  { return leftPrecTree(rest, right) }  /
              RelExpr
RelExpr    = rest:(AddExpr _ rel_op _)* right:AddExpr  { return leftPrecTree(rest, right) }  /
              AddExpr
AddExpr    = rest:(MulExpr _ add_op _)* right:MulExpr  { return leftPrecTree(rest, right) }  /
              MulExpr
MulExpr    = rest:(UnaryExpr _ mul_op _)* right:UnaryExpr  { return leftPrecTree(rest, right) }  /
              UnaryExpr
UnaryExpr  = PrimaryExpr /
             op:unary_op _ expr:UnaryExpr { return op(expr) }

// Operators are parsed into a function, that can be applied on operands to construct a token.
rel_op      = "==" { return makeBinaryOperator("equal") } /
              "!=" { return makeBinaryOperator("not_equal") } /
              "<" { return makeBinaryOperator("less") } /
              "<=" { return makeBinaryOperator("less_or_equal") } /
              ">" { return makeBinaryOperator("greater") } /
              ">=" { return makeBinaryOperator("greater_or_equal") }
add_op      = "+" { return makeBinaryOperator("sum") } /
              "-" { return makeBinaryOperator("difference") } /
              "|" { return makeBinaryOperator("bitwise_or") } /
              "^" { return makeBinaryOperator("bitwise_xor") }
mul_op      = "*" { return makeBinaryOperator("product") } /
              "/" { return makeBinaryOperator("quotient") } /
              "%" { return makeBinaryOperator("remainder") } /
              "<<" { return makeBinaryOperator("left_shift") } /
              ">>" { return makeBinaryOperator("right_shift") } /
              "&" { return makeBinaryOperator("bitwise_and") } /
              "&^" { return makeBinaryOperator("bit_clear") }
disjunct_op = "||" { return makeBinaryOperator("conditional_or") }
conjunct_op = "&&" { return makeBinaryOperator("conditional_and") }

unary_op   = "+" { return makeUnaryOperator("plus") } / // Note: This operator is unnamed in Golang specs.
             "-" { return makeUnaryOperator("negation") } /
             "!" { return makeUnaryOperator("not") } /
             "^" { return makeUnaryOperator("bitwise_complement") } /
             "*" { return makeUnaryOperator("indirection") } /
             "&" { return makeUnaryOperator("address") } /
             "<-" { return makeUnaryOperator("receive") }


// =============== Primary Expressions (Partial) ===============
//! TODO: Add support for all primary expressions instead of numerical.
PrimaryExpr = Operand


// =============== Operands (Partial) ===============
//! TODO: Add support for all operands instead of just (expression).
Operand = Literal / "(" _ @Expression _ ")"
Literal = BasicLit
BasicLit = float_lit / int_lit / string_lit