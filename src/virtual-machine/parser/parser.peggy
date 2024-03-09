// Utility functions to help in parsing.
{{
  import {
    IntegerLiteralToken,
    FloatLiteralToken,
    StringLiteralToken,
    BinaryOperator,
    UnaryOperator,
  } from './tokens'

  // Checks whether an identifier is valid (not a reserved keyword).
  function checkIdentifier(identifier) {
    const reserved_keywords = [
      'break', 'case', 'chan', 'const', 'continue', 'default',
      'defer', 'else', 'fallthrough', 'for', 'func', 'go', 'goto',
      'if', 'import', 'interface', 'map', 'package', 'range', 'return',
      'select', 'struct', 'switch', 'type', 'var'
    ]
    return !reserved_keywords.includes(identifier)
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
start = _ @SourceFile _


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
identifier = @iden:$(letter (letter / unicode_digit)*) &{ return checkIdentifier(iden) }

//* Integer Literals
int_lit = number:binary_lit  { return IntegerLiteralToken.fromSource(number, 2) } /
          number:octal_lit   { return IntegerLiteralToken.fromSource(number, 8) } /
          number:decimal_lit { return IntegerLiteralToken.fromSource(number, 10) } /
          number:hex_lit     { return IntegerLiteralToken.fromSource(number, 16) } 
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
float_lit = number:$decimal_float_lit { return FloatLiteralToken.fromSource(number); }

decimal_float_lit = decimal_digits "." decimal_digits? decimal_exponent? /
                    decimal_digits decimal_exponent /
                    "." decimal_digits decimal_exponent?
decimal_exponent  = [eE] ("+" / "-")? decimal_digits

//! TODO (P5): Support imaginary literals.
//! TODO (P3): Support rune literals.

//* String Literals
string_lit             = raw_string_lit / interpreted_string_lit
raw_string_lit         = "`" str:$[^`]* "`" { return StringLiteralToken.fromSourceRaw(str) }
interpreted_string_lit = '"' str:$[^\n"]* '"' { return StringLiteralToken.fromSourceInterpreted(str) }
//! TODO (P3): Interpreted string literals should interpret rune literals.





//* =============== Types ===============
Type     = TypeName TypeArgs? / TypeLit / "(" _ Type _ ")"
//! TODO (P1): Support qualified identifiers for TypeName.
TypeName = identifier 
TypeArgs = "[" _ TypeList _ ","? "]"
TypeList = Type (_ "," _ Type )*
TypeLit  = ArrayType / StructType / PointerType / FunctionType / InterfaceType / SliceType / MapType / ChannelType

//* Array Types
ArrayType   = "[" _ ArrayLength _ "]" ElementType
ArrayLength = Expression
ElementType = Type

//* Slice Types
SliceType = "[" "]" ElementType

//* Struct Types
StructType    = "struct" _ "{" _ (_ FieldDecl _ ";")* _ "}"
FieldDecl      = (IdentifierList Type / EmbeddedField) Tag?
EmbeddedField = "*"? TypeName TypeArgs?
Tag           = string_lit

//* Pointer Types
PointerType = "*" BaseType
BaseType = Type

//* Function Types
FunctionType  = "func" _ Signature
Signature     = Parameters _ Result?
Result        = Parameters / Type
Parameters    = "(" _ (_ ParameterList _ ",")? _ ")"
ParameterList = ParameterDecl ("," _ ParameterDecl)*
ParameterDecl = IdentifierList? "..."? Type

//* Interface Types
InterfaceType  = "interface" _ "{" _ (_ InterfaceElem _ ";")* _ "}"
InterfaceElem  = MethodElem / TypeElem
MethodElem     = MethodName _ Signature
MethodName     = identifier
TypeElem       = TypeTerm _ ("|" _ TypeTerm _)*
TypeTerm       = Type / UnderlyingType
UnderlyingType = "~" Type

//* Map Types
MapType = "map" _ "[" _ "KeyType" _ "]" ElementType
KeyType = Type

//* Channel Types
ChannelType = ("chan" / "chan" _ "<-" / "<-" _ "chan") _ ElementType





//* =============== Blocks ===============
Block = "{" _ StatementList _ "}"
StatementList = (_ Statement _ ";")*





//* =============== Declarations and Scope ===============
Declaration  = ConstDecl / TypeDecl / VarDecl
TopLevelDecl = Declaration / FunctionDecl / MethodDecl

//* Constant Declarations
ConstDecl      = "const" (ConstSpec / "(" (ConstSpec ";")* ")")
ConstSpec      = IdentifierList (Type? _ "=" _ ExpressionList)?
IdentifierList = identifier (_ "," _ identifier _)*
ExpressionList = Expression (_ "," _ Expression _)*

//* Type Declarations
TypeDecl  = "type" _ (TypeSpec / "(" _ (_ TypeSpec _ ";")* _ ")")
TypeSpec  = AliasDecl / TypeDef
AliasDecl = identifier _ "=" _ Type
TypeDef   = identifier _ TypeParameters? _ Type
TypeParameters = "[" _ TypeParamList _ ","? _ "]"
TypeParamList  = TypeParamDecl (_ "," _ TypeParamDecl)*
TypeParamDecl  = IdentifierList _ TypeConstraint
TypeConstraint = TypeElem

//* Variable Declarations
VarDecl = "var" _ (VarSpec / "(" _ (_ VarSpec _ ";")* _ ")")
VarSpec = IdentifierList _ (Type (_ "=" _ ExpressionList)? / _ "=" _ ExpressionList)

//* Short Variable Declarations
ShortVarDecl = IdentifierList _ ":=" _ ExpressionList

//* Function Declarations
FunctionDecl = "func" _ FunctionName _ TypeParameters? _ Signature _ FunctionBody?
FunctionName = identifier
FunctionBody = Block

//* Method Declarations
MethodDecl = "func" _ Receiver _ MethodName _ Signature _ FunctionBody?
Receiver   = Parameters





//* =============== Expressions ===============
//* Operands (Partial)
Operand     = Literal / OperandName _ TypeArgs? / "(" _ @Expression _ ")"
Literal     = BasicLit / CompositeLit / FunctionLit
//! TODO (P3): Add support for imaginary_lit.
//! TODO (P5): Add support for rune_lit.
BasicLit    = float_lit / int_lit / string_lit
OperandName = identifier / QualifiedIdent

//* Qualified Identifiers
QualifiedIdent = PackageName "." identifier

//* Composite Literals
CompositeLit = LiteralType _ LiteralValue
LiteralType  = StructType | ArrayType | "[" _ "..." _ "]" ElementType / SliceType / MapType / TypeName _ TypeArgs?
LiteralValue = "{" (ElementList _ ","? _)? "}"
ElementList  = KeyedElement (_ "," _ KeyedElement)*
KeyedElement = (Key _ ":")? _ Element
Key          = FieldName / Expression / LiteralValue
FieldName    = identifier
Element      = Expression / LiteralValue

//* Function Literals
FunctionLit = "func" _ Signature _ FunctionBody

//* Primary Expressions
PrimaryExpr   = MethodExpr _ PrimaryExprRest? / Operand _ PrimaryExprRest? / Conversion _ PrimaryExprRest?
PrimaryExprRest = PrimaryExprTerm _ PrimaryExprRest?
// This PrimaryExprTerm is added to fix left recursion.
PrimaryExprTerm = Selector / Index / Slice / TypeAssertion / Arguments
Selector      = "." identifier
Index         = "[" _ Expression (_ ",")? _ "]"
Slice         = "[" _ Expression? _ ":" _ Expression _ ":" _ Expression _ "]"
TypeAssertion = "." _ "(" _ Type _ ")"
Arguments     = "(" _ ((ExpressionList / Type (_ "," _ ExpressionList)?) _ "..."? _ ","? _)? _ ")"

//* Method Expressions
MethodExpr   = ReceiverType "." MethodName
ReceiverType = Type

//* Operators
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

//* Conversions
Conversion = Type _ "(" _ Expression _ ")" _ ","? _ ")"





//* =============== Statements ===============
//* Statements
//! TODO (P1): This is painfully incomplete.
Statement  = Declaration / LabeledStmt / SimpleStmt /
	           GoStmt / ReturnStmt / BreakStmt / ContinueStmt / GotoStmt /
             FallthroughStmt / Block / IfStmt / SwitchStmt / SelectStmt / ForStmt /
             DeferStmt
// Note that EmptyStmt is removed from SimpleStmt to simplify parsing.
// Instead, users of Statement should allow it to be empty.
SimpleStmt = ExpressionStmt / SendStmt / IncDecStmt / Assignment / ShortVarDecl

//* Labeled Statements
LabeledStmt = Label _ ":" _ Statement
Label       = identifier

//* Expression Statements
ExpressionStmt = Expression

//* Send Statements
SendStmt = Channel _ "<-" _ Expression
Channel  = Expression

//* IncDec Statements
IncDecStmt = Expression _ ("++" / "--")

//* Assignment Statements
Assignment = ExpressionList _ assign_op _ ExpressionList
assign_op = (add_op / mul_op)? "="

//* If Statements
IfStmt = "if" _ (SimpleStmt _ ";")? _ Expression _ Block _ ("else" _ (IfStmt / Block))?

//* Switch Statements
SwitchStmt      = ExprSwitchStmt / TypeSwitchStmt

ExprSwitchStmt  = "switch" _ (SimpleStmt _ ";")? _ Expression? _ "{" _ (_ ExprCaseClause _)* "}"
ExprCaseClause  = ExprSwitchCase _ ":" _ StatementList
ExprSwitchCase  = "case" _ ExpressionList / "default"

TypeSwitchStmt  = "switch" _ (SimpleStmt _ ";")? _ TypeSwitchGuard _ "{" _ (_ TypeCaseClause _)* _ ")"
TypeSwitchGuard = (identifier _ ":=")? _ PrimaryExpr _ "." _ "(" _ "type" _ ")"
TypeCaseClause  = TypeSwitchCase _ ":" _ StatementList
TypeSwitchCase  = "case" _ TypeList / "default"

//* For Statements
ForStmt   = "for" _ (Condition / ForClause / RangeClause)? Block
Condition = Expression

ForClause = InitStmt? _ ";" _ Condition? _ ";" _ PostStmt?
InitStmt  = SimpleStmt
PostStmt  = SimpleStmt

RangeClause = (ExpressionList _ "=" / IdentifierList _ ":=")? _ "range" _ Expression

//* Go Statements
GoStmt = "go" _ Expression

//* Select Statements
SelectStmt = "select" _ "{" _ (_ CommClause _)? _ "}"
CommClause = CommCase _ ":" _ StatementList
CommCase   = "case" _ (SendStmt / RecvStmt)? / "default"
RecvStmt   = (ExpressionList _ "=" / IdentifierList _ ":=")? RecvExpr
RecvExpr   = Expression

//* Return Statements
ReturnStmt = "return" _ ExpressionList?

//* Break Statements
BreakStmt = "break" _ Label?

//* Continue Statements
ContinueStmt = "continue" _ Label?

//* Goto Statements
GotoStmt = "goto" _ Label

//* Fallthrough Statements
FallthroughStmt = "fallthrough"

//* Defer Statements
DeferStmt = "defer" _ Expression





//* =============== Packages ===============
//* Source File
SourceFile = pkg:PackageClause _ ";" _ (_ imports:ImportDecl _ ";" _)* (_ declarations:TopLevelDecl _ ";")*

//* Package Clause
PackageClause = "package" _ PackageName
PackageName = identifier

//* Import Declarations
ImportDecl = "import" _ (ImportSpec / "(" _ (_ ImportSpec _ ";")* _ ")")
ImportSpec = ("." / PackageName)? _ ImportPath
ImportPath = string_lit