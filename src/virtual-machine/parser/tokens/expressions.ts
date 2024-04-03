import { Compiler } from '../../compiler'
import { CallInstruction } from '../../compiler/instructions/funcs'
import { FunctionType, NoType, Type, TypeUtility } from '../../compiler/typing'

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
    let operandType = this.operand.compile(compiler)
    for (const modifier of this.rest ?? []) {
      operandType = modifier.compile(compiler, operandType)
    }
    return operandType
  }
}

// Note: The reason this class DOES NOT extend from Token, is because each modifier
// requires type information about the previous operand in the chain in order to compile.
// Hence, its compilation method must take in an extra argument. Idk if this is the correct way
// to fix, but it doesn't make sense to force them to follow the structure of Token.
export abstract class PrimaryExpressionModifierToken {
  constructor(public type: string) {}
  abstract compile(compiler: Compiler, operandType: Type): Type
}

export class SelectorToken extends PrimaryExpressionModifierToken {
  constructor(public identifier: string) {
    super('selector')
  }

  override compile(_compiler: Compiler, _operandType: Type): Type {
    //! TODO: Implement.
    return new NoType()
  }
}

export class IndexToken extends PrimaryExpressionModifierToken {
  constructor(public expression: ExpressionToken) {
    super('index')
  }

  override compile(_compiler: Compiler, _operandType: Type): Type {
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

  override compile(_compiler: Compiler, _operandType: Type): Type {
    //! TODO: Implement.
    return new NoType()
  }
}

export class CallToken extends PrimaryExpressionModifierToken {
  expressions: ExpressionToken[]

  constructor(expressions: ExpressionToken[] | null) {
    super('call')
    this.expressions = expressions ?? []
  }

  override compile(compiler: Compiler, operandType: Type): Type {
    //! TODO: Implement the actual calling of the function.
    if (!(operandType instanceof FunctionType)) {
      throw Error(
        `Invalid operation: cannot call non-function (of type ${operandType})`,
      )
    }

    const argumentTypes = this.expressions.map((e) => e.compile(compiler))
    compiler.instructions.push(new CallInstruction(this.expressions.length))

    if (argumentTypes.length < operandType.parameters.length) {
      throw Error(
        `Not enough arguments in function call\n` +
          `have (${TypeUtility.arrayToString(argumentTypes)})\n` +
          `want (${TypeUtility.arrayToString(operandType.parameters)})`,
      )
    }
    if (argumentTypes.length > operandType.parameters.length) {
      throw Error(
        `Too many arguments in function call\n` +
          `have (${TypeUtility.arrayToString(argumentTypes)})\n` +
          `want (${TypeUtility.arrayToString(operandType.parameters)})`,
      )
    }

    for (let i = 0; i < argumentTypes.length; i++) {
      if (argumentTypes[i].equals(operandType.parameters[i].type)) continue
      throw Error(
        `Cannot use ${argumentTypes[i]} as ${operandType.parameters[i]} in argument to function call`,
      )
    }

    if (operandType.results.length === 0) return new NoType()
    //! TODO: How to handle returning multiple values?
    return operandType.results[0].type
  }
}
