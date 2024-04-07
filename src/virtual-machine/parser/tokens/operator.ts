import { Compiler } from '../../compiler'
import {
  BinaryInstruction,
  LoadChannelReqInstruction,
  LoadDefaultInstruction,
  TryChannelReqInstruction,
  UnaryInstruction,
} from '../../compiler/instructions'
import { BoolType, ChannelType, Type } from '../../compiler/typing'

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
    if (this.name === 'receive') {
      if (!(expressionType instanceof ChannelType))
        throw Error('Receive Expression not chan')
      const recvType = expressionType.element
      compiler.instructions.push(new LoadDefaultInstruction(recvType))
      compiler.instructions.push(
        new LoadChannelReqInstruction(true, compiler.instructions.length + 2),
      )
      compiler.instructions.push(new TryChannelReqInstruction())
      return recvType
    } else {
      compiler.instructions.push(new UnaryInstruction(this.name))
      return expressionType
    }
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
    const logical_operators = [
      'equal',
      'not_equal',
      'less',
      'less_or_equal',
      'greater',
      'greater_or_equal',
      'conditional_or',
      'conditional_and',
    ]
    return logical_operators.includes(this.name) ? new BoolType() : leftType
  }
}
