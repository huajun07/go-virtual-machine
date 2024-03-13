// Utility functions to help in parsing.
{{
  import {
    IntegerLiteralToken,
    FloatLiteralToken,
    StringLiteralToken,
    BinaryOperator,
    UnaryOperator,
    SourceFileToken,
    ImportToken,
    FunctionDeclarationToken,
    VariableDeclarationToken,
    ConstantDeclarationToken,
    PrimaryExpressionToken,
    AssignmentStatementToken,
    IdentifierToken,
    ShortVariableDeclarationToken,
    IncDecStatementToken,
    ReturnStatementToken,
    BreakStatementToken,
    ContinueStatementToken,
    FallthroughStatementToken,
    IfStatementToken,
    BlockToken,
    ForStatementToken,
    DeferStatementToken,
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
identifier = iden:$(letter (letter / unicode_digit)*) &{ return checkIdentifier(iden) }
             { return new IdentifierToken(iden) }

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
//! TODO (P5): If we ever add type checking, then type should return more than just an empty token.
Type     = TypeName TypeArgs? / TypeLit / "(" _ Type _ ")" { return TypeToken() }
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
Block = "{" _ statements:StatementList _ "}" { return new BlockToken(statements) }
StatementList = (_ @Statement _ ";")*





//* =============== Declarations and Scope ===============
//! TODO (P5): Tokenize TypeDecl.
Declaration  = ConstDecl / TypeDecl / VarDecl
//! TODO (P4): Tokenize MethodDecl.
TopLevelDecl = Declaration / FunctionDecl / MethodDecl

//* Constant Declarations
//! TODO (P5): Multiple declarations (optionally semicolon-separated) is not supported.
ConstDecl      = "const" _ @ConstSpec
ConstSpec      = identifiers:IdentifierList _ rest:(
                    varType:Type? _ "=" _ expressions:ExpressionList
                    { return { varType, expressions } }
                 )
                 { return new ConstantDeclarationToken(identifiers, rest.expressions, rest.varType) }

IdentifierList = head:identifier tail:(_ "," _ @identifier _)* { return [head, ...tail] }
ExpressionList = head:Expression tail:(_ "," _ @Expression _)* { return [head, ...tail] }

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
//! TODO (P5): Multiple declarations (optionally semicolon-separated) is not supported.
VarDecl = "var" _ @VarSpec
VarSpec = identifiers:IdentifierList _ rest:(
            varType:Type expressions:(_ "=" _ @ExpressionList)? 
            { return {varType, expressions} }
            /
            _ "=" _ expressions:ExpressionList
            { return {varType: undefined, expressions} }
          )
          { return new VariableDeclarationToken(identifiers, rest.varType, rest.expressions) }

//* Short Variable Declarations
ShortVarDecl = identifiers:IdentifierList _ ":=" _ expressions:ExpressionList
               { return new ShortVariableDeclarationToken(identifiers, expressions) }

//* Function Declarations
// Note: TypeParameters? is omitted from FunctionDecl as we do not support generics.
FunctionDecl = "func" _ name:FunctionName _ signature:Signature _ body:Block?
               { return new FunctionDeclarationToken(name, signature, body) }
FunctionName = identifier
FunctionBody = Block

//* Method Declarations
MethodDecl = "func" _ Receiver _ MethodName _ Signature _ FunctionBody?
Receiver   = Parameters





//* =============== Expressions ===============
//* Operands (Partial)
// OperandName [ TypeArgs ] is excluded as generics are not supported
Operand     = Literal / OperandName / "(" _ @Expression _ ")"
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
//! TODO (P5): MethodExpr and Conversion are not supported.
PrimaryExpr     = operand:Operand _ rest:PrimaryExprModifier* { return new PrimaryExpressionToken(operand, rest) }
//! TODO (P2): Tokenize PrimaryExprModifier.
// This PrimaryExprTerm is added to fix left recursion.
PrimaryExprModifier = Selector / Index / Slice / TypeAssertion / Arguments
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
rel_op      = "==" { return BinaryOperator.fromSource("equal") } /
              "!=" { return BinaryOperator.fromSource("not_equal") } /
              "<" { return BinaryOperator.fromSource("less") } /
              "<=" { return BinaryOperator.fromSource("less_or_equal") } /
              ">" { return BinaryOperator.fromSource("greater") } /
              ">=" { return BinaryOperator.fromSource("greater_or_equal") }
add_op      = "+" { return BinaryOperator.fromSource("sum") } /
              "-" { return BinaryOperator.fromSource("difference") } /
              "|" { return BinaryOperator.fromSource("bitwise_or") } /
              "^" { return BinaryOperator.fromSource("bitwise_xor") }
mul_op      = "*" { return BinaryOperator.fromSource("product") } /
              "/" { return BinaryOperator.fromSource("quotient") } /
              "%" { return BinaryOperator.fromSource("remainder") } /
              "<<" { return BinaryOperator.fromSource("left_shift") } /
              ">>" { return BinaryOperator.fromSource("right_shift") } /
              "&" { return BinaryOperator.fromSource("bitwise_and") } /
              "&^" { return BinaryOperator.fromSource("bit_clear") }
disjunct_op = "||" { return BinaryOperator.fromSource("conditional_or") }
conjunct_op = "&&" { return BinaryOperator.fromSource("conditional_and") }

unary_op   = "+" { return UnaryOperator.fromSource("plus") } / // Note: This operator is unnamed in Golang specs.
             "-" { return UnaryOperator.fromSource("negation") } /
             "!" { return UnaryOperator.fromSource("not") } /
             "^" { return UnaryOperator.fromSource("bitwise_complement") } /
             "*" { return UnaryOperator.fromSource("indirection") } /
             "&" { return UnaryOperator.fromSource("address") } /
             "<-" { return UnaryOperator.fromSource("receive") }

//* Conversions
Conversion = Type _ "(" _ Expression _ ")" _ ","? _ ")"





//* =============== Statements ===============
//* Statements
//! TODO (P5): LabeledStmt, GotoStmt are not tokenized as they're probably not so important.
//!            Note that labels do not work for now.
//! TODO (P4): SwitchStmt should be tokenized.
//! TODO (P3): GoStmt, SelectStmt should be tokenized when we add concurrency.
Statement  = Declaration / LabeledStmt / SimpleStmt /
	           GoStmt / ReturnStmt / BreakStmt / ContinueStmt / GotoStmt /
             FallthroughStmt / Block / IfStmt / SwitchStmt / SelectStmt / ForStmt /
             DeferStmt
// Note that EmptyStmt is removed from SimpleStmt to simplify parsing.
// Instead, users of Statement should allow it to be empty.
SimpleStmt = SendStmt / IncDecStmt / Assignment / ShortVarDecl / ExpressionStmt

//* Labeled Statements
LabeledStmt = Label _ ":" _ Statement
Label       = identifier

//* Expression Statements
ExpressionStmt = Expression

//* Send Statements
SendStmt = Channel _ "<-" _ Expression
Channel  = Expression

//* IncDec Statements
IncDecStmt = expression:Expression _ op:("++" / "--")
             { return new IncDecStatementToken(expression, op) }

//* Assignment Statements
Assignment = left:ExpressionList _ op:$assign_op _ right:ExpressionList
             { return new AssignmentStatementToken(left, op, right) }
assign_op  = [\*\+]? "="

//* If Statements
IfStmt = "if" _ init:(@SimpleStmt _ ";")? _ pred:Expression _ cons:Block _
         alt:("else" _ @(IfStmt / Block))?
         { return new IfStatementToken(init, pred, cons, alt) }

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
//! TODO (P4): Support RangeClause in ForStmt.
ForStmt   = "for" _
            clause:(ForClause /
                    cond:Condition { return {init: undefined, cond, post: undefined }}
                    )?
            _ body:Block
            { return new ForStatementToken(clause?.init, clause?.cond, clause?.post, body)}
Condition = Expression

ForClause = init:InitStmt? _ ";" _ cond:Condition? _ ";" _ post:PostStmt?
            { return { init: init ?? undefined, cond: cond ?? undefined, post: post ?? undefined } }
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
ReturnStmt = "return" _ returns:ExpressionList?
             { return new ReturnStatementToken(returns) }

//* Break Statements
//! TODO (P5): Labels are not tokenized.
BreakStmt = "break" _ Label? { return new BreakStatementToken() }

//* Continue Statements
//! TODO (P5): Labels are not tokenized.
ContinueStmt = "continue" _ Label? { return new ContinueStatementToken() }

//* Goto Statements
GotoStmt = "goto" _ Label

//* Fallthrough Statements
FallthroughStmt = "fallthrough" { return new FallthroughStatementToken() }

//* Defer Statements
DeferStmt = "defer" _ expression:Expression { return new DeferStatementToken(expression) }





//* =============== Packages ===============
//* Source File
SourceFile = pkg:PackageClause _ ";" _ imports:(_ @ImportDecl _ ";" _)* declarations:(_ @TopLevelDecl _ ";")*
             { return new SourceFileToken(pkg, imports, declarations) }

//* Package Clause
PackageClause = "package" _ @PackageName
PackageName = identifier

//* Import Declarations
ImportDecl = "import" _ @(ImportSpec / "(" _ (_ ImportSpec _ ";")* _ ")")
ImportSpec = name:("." / PackageName)? _ path:ImportPath
             { return new ImportToken(path, name) }
ImportPath = string_lit