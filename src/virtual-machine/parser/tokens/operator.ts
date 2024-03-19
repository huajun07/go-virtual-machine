import { Token } from './base'

abstract class Operator extends Token {
  name: string
  children: Token[]

  constructor(type: string, name: string, children: Token[]) {
    super(type)
    this.name = name
    this.children = children
  }
}

export class UnaryOperator extends Operator {
  constructor(name: string, child: Token) {
    super('unary_operator', name, [child])
  }

  /** Returns a function that can be applied on its child token to create a UnaryOperator. */
  static fromSource(name: string) {
    return (child: Token) => {
      return new UnaryOperator(name, child)
    }
  }

  static is(token: Token): token is UnaryOperator {
    return token.type === 'unary_operator'
  }
}

export class BinaryOperator extends Operator {
  constructor(name: string, left: Token, right: Token) {
    super('binary_operator', name, [left, right])
  }

  /** Returns a function that can be applied on its children tokens to create a BinaryOperator. */
  static fromSource(name: string) {
    return (left: Token, right: Token) => {
      return new BinaryOperator(name, left, right)
    }
  }

  static is(token: Token): token is BinaryOperator {
    return token.type === 'binary_operator'
  }
}
