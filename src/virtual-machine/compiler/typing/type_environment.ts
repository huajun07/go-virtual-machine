import {
  ExpressionToken,
  FloatLiteralToken,
  IntegerLiteralToken,
  LiteralToken,
  StringLiteralToken,
} from 'src/virtual-machine/parser/tokens'

import { Float64Type, Int64Type, StringType, Type } from '.'

export class TypeEnvironment {
  parent?: TypeEnvironment
  typings: Record<string, Type>

  constructor(parent?: TypeEnvironment) {
    this.parent = parent
    this.typings = {}
  }

  addType(name: string, type: Type) {
    this.typings[name] = type
  }

  /** Returns an extended type environment. */
  extend(): TypeEnvironment {
    const newTypeEnvironment = new TypeEnvironment(this)
    return newTypeEnvironment
  }

  pop(): TypeEnvironment {
    if (!this.parent) {
      throw Error('Type environment stack is empty when popped.')
    }
    return this.parent
  }

  /** Returns the type of the variable with the given name. */
  get(name: string): Type {
    if (name in this.typings) {
      return this.typings[name]
    }
    if (this.parent === undefined) {
      throw Error(`Variable ${name} not found`)
    }
    return this.parent.get(name)
  }

  /** Evaluate the type of the given expression. */
  getExpressionType(expression: ExpressionToken): Type {
    if (expression instanceof LiteralToken) {
      const literalToType = [
        [IntegerLiteralToken, Int64Type],
        [FloatLiteralToken, Float64Type],
        [StringLiteralToken, StringType],
      ] as const
      for (const [tokenClass, typeClass] of literalToType) {
        if (expression instanceof tokenClass) {
          return new typeClass()
        }
      }
    }

    throw Error('Unimplemented.')
  }
}
