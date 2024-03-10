import { Token } from './base'
import { LiteralToken } from './literals'
import { BinaryOperator, UnaryOperator } from './operator'

export type ExpressionToken =
  | LiteralToken
  | UnaryOperator
  | BinaryOperator
  | PrimaryExpressionToken

export type OperandToken = LiteralToken | ExpressionToken

export class PrimaryExpressionToken extends Token {
  operand: OperandToken
  /** The remaining PrimaryExpression that is applied to the current operand. E.g. selector / index etc. */
  rest?: PrimaryExpressionToken

  constructor(operand: OperandToken, rest?: PrimaryExpressionToken) {
    super('primary_expression')
    this.operand = operand
    this.rest = rest
  }
}
