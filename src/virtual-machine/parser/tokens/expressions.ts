import { Token } from './base'
import { IdentifierToken } from './identifier'
import { LiteralToken } from './literals'
import { BinaryOperator, UnaryOperator } from './operator'

export type ExpressionToken =
  | LiteralToken
  | UnaryOperator
  | BinaryOperator
  | PrimaryExpressionToken

export function isExpressionToken(obj: any): obj is ExpressionToken {
  return (
    obj instanceof LiteralToken ||
    obj instanceof UnaryOperator ||
    obj instanceof BinaryOperator ||
    obj instanceof PrimaryExpressionToken
  )
}

export type OperandToken = IdentifierToken | ExpressionToken

export class PrimaryExpressionToken extends Token {
  operand: OperandToken
  /** The remaining modifier that is applied to the current operand. E.g. selector / index etc. */
  rest: PrimaryExpressionModifierToken[] | null

  constructor(
    operand: OperandToken,
    rest: PrimaryExpressionModifierToken[] | null,
  ) {
    super('primary_expression')
    this.operand = operand
    this.rest = rest
  }
}

export class PrimaryExpressionModifierToken extends Token {}

export class SelectorToken extends PrimaryExpressionModifierToken {
  constructor(public identifier: string) {
    super('selector')
  }
}

export class IndexToken extends PrimaryExpressionModifierToken {
  constructor(public expression: ExpressionToken) {
    super('index')
  }
}

export class SliceToken extends PrimaryExpressionModifierToken {
  constructor(
    public from: ExpressionToken | null,
    public to: ExpressionToken | null,
  ) {
    super('slice')
  }
}

export class CallToken extends PrimaryExpressionModifierToken {
  constructor(public expressions: ExpressionToken[] | null) {
    super('call')
  }
}
