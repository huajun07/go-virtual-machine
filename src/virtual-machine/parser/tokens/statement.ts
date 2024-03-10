import { Token } from './base'
import { ExpressionToken } from './expressions'

//! TODO (P1): Add other types of statements and expressions
export type StatementToken = ExpressionToken

export class AssignmentStatementToken extends Token {
  left: ExpressionToken[]
  /** One of "=", "+=" and "*=" */
  operation: string
  right: ExpressionToken[]

  constructor(
    left: ExpressionToken[],
    operation: string,
    right: ExpressionToken[],
  ) {
    super('assignment')
    this.left = left
    this.operation = operation
    this.right = right
  }
}
