import { Token } from './base'
import { BlockToken } from './block'
import { ExpressionToken } from './statement'
import { TypeToken } from './type'

export abstract class TopLevelDeclarationToken extends Token {}

//! TODO (P1): Add the other types of Top Level Declarations.

export class FunctionDeclarationToken extends TopLevelDeclarationToken {
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

//! TODO (P1): Add the other types of Declarations.

export class VariableDeclarationToken extends DeclarationToken {
  identifiers: string[]
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
