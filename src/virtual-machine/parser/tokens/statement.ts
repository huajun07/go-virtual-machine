import { Token } from './base'
import { ExpressionToken } from './expressions'

//! TODO (P1): Add other types of statements and expressions
export type StatementToken = ExpressionToken

export class AssignmentStatementToken extends Token {
  left: ExpressionToken[]
  operation: '=' | '+=' | '*='
  right: ExpressionToken[]

  constructor(
    left: ExpressionToken[],
    operation: '=' | '+=' | '*=',
    right: ExpressionToken[],
  ) {
    super('assignment')
    this.left = left
    this.operation = operation
    this.right = right
  }
}

export class IncDecStatementToken extends Token {
  expression: ExpressionToken
  operation: '++' | '--'

  constructor(expression: ExpressionToken, operation: '++' | '--') {
    super('inc_dec')
    this.expression = expression
    this.operation = operation
  }
}

export class ReturnStatementToken extends Token {
  returns?: ExpressionToken[]

  constructor(returns?: ExpressionToken[]) {
    super('return')
    this.returns = returns
  }
}

export class BreakStatementToken extends Token {
  constructor() {
    super('break')
  }
}

export class ContinueStatementToken extends Token {
  constructor() {
    super('continue')
  }
}

export class FallthroughStatementToken extends Token {
  constructor() {
    super('fallthrough')
  }
}
