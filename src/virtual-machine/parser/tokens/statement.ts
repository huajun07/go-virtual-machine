import { Token } from './base'
import { BlockToken } from './block'
import { DeclarationToken, ShortVariableDeclarationToken } from './declaration'
import { ExpressionToken } from './expressions'

//! TODO (P1): Add other types of statements and expressions
export type StatementToken =
  | ExpressionToken
  | SimpleStatementToken
  | DeclarationToken

export type SimpleStatementToken =
  | IncDecStatementToken
  | AssignmentStatementToken
  | ShortVariableDeclarationToken
  | ExpressionToken

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

export class IfStatementToken extends Token {
  /** Executed before the predicate (e.g. if x := 0; x < 1 {} ) */
  initialization?: SimpleStatementToken
  predicate: ExpressionToken
  consequent: BlockToken
  alternative?: IfStatementToken | BlockToken

  constructor(
    initialization: SimpleStatementToken | undefined,
    predicate: ExpressionToken,
    consequent: BlockToken,
    alternative: IfStatementToken | BlockToken | undefined,
  ) {
    super('if')
    this.initialization = initialization
    this.predicate = predicate
    this.consequent = consequent
    this.alternative = alternative
  }
}

export class ForStatementToken extends Token {
  // There are 4 types of for loops:
  // 1. For statement that iterates the body repeatedly.
  // 2. For statements with a single condition.
  // 3. For statements with a for clause (init, condition, post).
  // 4. For statements with a range clause.
  //! Note that range clauses are not supported for now. They will likely be a seperate class.

  initialization?: SimpleStatementToken
  condition?: ExpressionToken
  post?: SimpleStatementToken
  body: BlockToken

  constructor(
    initialization: SimpleStatementToken | undefined,
    condition: ExpressionToken | undefined,
    post: ExpressionToken | undefined,
    body: BlockToken,
  ) {
    super('for')
    this.initialization = initialization
    this.condition = condition
    this.post = post
    this.body = body
  }
}

export class DeferStatementToken extends Token {
  expression: ExpressionToken

  constructor(expression: ExpressionToken) {
    super('defer')
    this.expression = expression
  }
}
