import { Token } from './base'
import { BlockToken } from './block'
import { ExpressionToken } from './expressions'
import { TypeToken } from './type'

export type TopLevelDeclarationToken =
  | DeclarationToken
  | FunctionDeclarationToken

//! TODO (P1): Add the other types of Top Level Declarations.

export class FunctionDeclarationToken extends Token {
  name: string
  signature: SignatureToken
  body?: BlockToken

  constructor(name: string, _signature: SignatureToken, body?: BlockToken) {
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
  identifiers: string[]
  expressions: ExpressionToken[]

  constructor(identifiers: string[], expressions: ExpressionToken[]) {
    super('short_variable_declaration')
    this.identifiers = identifiers
    this.expressions = expressions
  }
}

export class VariableDeclarationToken extends DeclarationToken {
  identifiers: string[]
  // Note: A variable declaration must have at least one of varType / expressions.
  varType?: TypeToken
  expressions?: ExpressionToken[]

  constructor(
    identifiers: string[],
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
  identifiers: string[]
  varType?: TypeToken
  expressions?: ExpressionToken[]

  constructor(
    identifiers: string[],
    varType?: TypeToken,
    expressions?: ExpressionToken[],
  ) {
    super('const_declaration')
    console.log(identifiers, varType, expressions)
    this.identifiers = identifiers
    this.varType = varType
    this.expressions = expressions
  }
}
