import { Compiler } from 'src/virtual-machine/compiler'
import {
  BinaryInstruction,
  UnaryInstruction,
} from 'src/virtual-machine/compiler/instructions'
import { Type } from 'src/virtual-machine/compiler/typing'

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

  override compile(compiler: Compiler): Type {
    const expressionType = this.children[0].compile(compiler)
    compiler.instructions.push(new UnaryInstruction(this.name))
    return expressionType
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

  override compile(compiler: Compiler): Type {
    const leftType = this.children[0].compile(compiler)
    const rightType = this.children[1].compile(compiler)
    if (!leftType.equals(rightType)) {
      throw Error(
        `Invalid operation (mismatched types ${leftType} and ${rightType})`,
      )
    }
    compiler.instructions.push(new BinaryInstruction(this.name))
    return leftType
  }
}
