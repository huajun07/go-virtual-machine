import { Compiler } from '../../compiler'
import { NoType, Type } from '../../compiler/typing'

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
  constructor(
    public operand: OperandToken,
    /** The remaining modifier that is applied to the current operand. E.g. selector / index etc. */
    public rest: PrimaryExpressionModifierToken[] | null,
  ) {
    super('primary_expression')
  }

  override compile(compiler: Compiler): Type {
    // TODO: Figure what this does for non-trivial ops like array access and selector
    return this.operand.compile(compiler)
  }
}

export abstract class PrimaryExpressionModifierToken extends Token {}

export class SelectorToken extends PrimaryExpressionModifierToken {
  constructor(public identifier: string) {
    super('selector')
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    return new NoType()
  }
}

export class IndexToken extends PrimaryExpressionModifierToken {
  constructor(public expression: ExpressionToken) {
    super('index')
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    return new NoType()
  }
}

export class SliceToken extends PrimaryExpressionModifierToken {
  constructor(
    public from: ExpressionToken | null,
    public to: ExpressionToken | null,
  ) {
    super('slice')
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    return new NoType()
  }
}

export class CallToken extends PrimaryExpressionModifierToken {
  constructor(public expressions: ExpressionToken[] | null) {
    super('call')
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    return new NoType()
  }
}
