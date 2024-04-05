import { Compiler } from '../../compiler'
import {
  LoadArrayElementInstruction,
  LoadConstantInstruction,
  LoadSliceElementInstruction,
} from '../../compiler/instructions'
import {
  CallInstruction,
  PrintInstruction,
} from '../../compiler/instructions/funcs'
import {
  ArrayType,
  ChannelType,
  FunctionType,
  Int64Type,
  NoType,
  SliceType,
  Type,
  TypeUtility,
} from '../../compiler/typing'

import { Token } from './base'
import { IdentifierToken } from './identifier'
import { LiteralToken } from './literals'
import { BinaryOperator, UnaryOperator } from './operator'
import { TypeToken } from './type'

export type ExpressionToken =
  | LiteralToken
  | UnaryOperator
  | BinaryOperator
  | PrimaryExpressionToken
  | BuiltinCallToken

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

  override compile(compiler: Compiler, operandType: Type): Type {
    if (operandType instanceof ArrayType) {
      this.compileIndex(compiler)
      compiler.instructions.push(new LoadArrayElementInstruction())
      return operandType.element
    } else if (operandType instanceof SliceType) {
      this.compileIndex(compiler)
      compiler.instructions.push(new LoadSliceElementInstruction())
      return operandType.element
    } else {
      throw Error(
        `Invalid operation: Cannot index a variable of type ${operandType}`,
      )
    }
  }

  private compileIndex(compiler: Compiler) {
    const indexType = this.expression.compile(compiler)
    if (!(indexType instanceof Int64Type)) {
      throw new Error(
        `Invalid argument: Index has type ${indexType} but must be an integer`,
      )
    }
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
      if (argumentTypes[i].assignableBy(operandType.parameters[i].type))
        continue
      throw Error(
        `Cannot use ${argumentTypes[i]} as ${operandType.parameters[i]} in argument to function call`,
      )
    }

    if (operandType.results.isVoid()) {
      return new NoType()
    }
    if (operandType.results.types.length === 1) {
      // A return type with a single value can be unwrapped.
      return operandType.results.types[0]
    }
    return operandType.results
  }
}

type BuiltinFunctionName = (typeof BuiltinCallToken.validNames)[number]
// The following builtin functions are omitted: new, panic, recover.
// This does not extend from PrimaryExpression because its parsing is completely separate:
// Certain builtin functions take in a type as the first argument (as opposed to a value).
export class BuiltinCallToken extends Token {
  static validNames = [
    'append',
    'clear',
    'close',
    'delete',
    'len',
    'cap',
    'make',
    'min',
    'max',
    'Println',
  ] as const

  static namesThatTakeType = ['make'] as const

  constructor(
    public name: BuiltinFunctionName,
    /** The first argument if it is a type. */
    public firstTypeArg: TypeToken | null,
    public args: ExpressionToken[],
  ) {
    super('builtin')
  }

  override compile(compiler: Compiler): Type {
    if (this.name === 'make') {
      const typeArg = (this.firstTypeArg as TypeToken).compile(compiler)
      if (!(typeArg instanceof SliceType || typeArg instanceof ChannelType)) {
        throw new Error(
          `Invalid argument: cannot make ${typeArg}; type must be slice, map, or channel`,
        )
      }
      //! TODO: Construct based on the args.
      return typeArg
    } else if (this.name === 'Println') {
      //! TODO: This should be fmt.Println.
      for (const arg of this.args) arg.compile(compiler)
      compiler.instructions.push(
        new LoadConstantInstruction(this.args.length, new Int64Type()),
      )
      compiler.instructions.push(new PrintInstruction())
      return new NoType()
    } else {
      throw new Error(`Builtin function ${this.name} is not yet implemented.`)
    }
  }
}
