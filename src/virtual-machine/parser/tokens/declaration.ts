import { Token } from './base'
import { BlockToken } from './block'
import { ExpressionToken } from './expressions'
import { IdentifierToken } from './identifier'
import { TypeToken } from './type'

export type TopLevelDeclarationToken =
  | DeclarationToken
  | FunctionDeclarationToken

//! TODO (P1): Add the other types of Top Level Declarations.

export class FunctionDeclarationToken extends Token {
  name: IdentifierToken
  signature: SignatureToken
  body?: BlockToken

  constructor(
    name: IdentifierToken,
    _signature: SignatureToken,
    body?: BlockToken,
  ) {
    super('function_declaration')
    this.name = name
    //! TODO (P1): Function signature
    this.signature = new SignatureToken()
    this.body = body
  }
}

export class SignatureToken extends Token {
  constructor() {
    super('signature')
  }
}

export abstract class DeclarationToken extends Token {}

export class ShortVariableDeclarationToken extends DeclarationToken {
  identifiers: IdentifierToken[]
  expressions: ExpressionToken[]

  constructor(identifiers: IdentifierToken[], expressions: ExpressionToken[]) {
    super('short_variable_declaration')
    this.identifiers = identifiers
    this.expressions = expressions
  }
}

export class VariableDeclarationToken extends DeclarationToken {
  identifiers: IdentifierToken[]
  // Note: A variable declaration must have at least one of varType / expressions.
  varType?: TypeToken
  expressions?: ExpressionToken[]

  constructor(
    identifiers: IdentifierToken[],
    varType?: TypeToken,
    expressions?: ExpressionToken[],
  ) {
    super('variable_declaration')
    this.identifiers = identifiers
    this.varType = varType
    this.expressions = expressions
  }
}

export class ConstantDeclarationToken extends DeclarationToken {
  identifiers: IdentifierToken[]
  varType?: TypeToken
  expressions: ExpressionToken[]

  constructor(
    identifiers: IdentifierToken[],
    expressions: ExpressionToken[],
    varType?: TypeToken,
  ) {
    super('const_declaration')
    this.identifiers = identifiers
    this.varType = varType
    this.expressions = expressions
  }
}
