import { Compiler } from '../../compiler'
import {
  BuiltinCapInstruction,
  BuiltinLenInstruction,
  LoadArrayElementInstruction,
  LoadChannelInstruction,
  LoadConstantInstruction,
  LoadSliceElementInstruction,
  SelectorOperationInstruction,
  SliceOperationInstruction,
} from '../../compiler/instructions'
import {
  CallInstruction,
  PrintInstruction,
} from '../../compiler/instructions/funcs'
import {
  ArrayType,
  BoolType,
  ChannelType,
  FunctionType,
  Int64Type,
  NoType,
  SliceType,
  StringType,
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
  | EmptyExpressionToken

export type OperandToken = IdentifierToken | ExpressionToken

export class EmptyExpressionToken extends Token {
  constructor(public argType: Type) {
    super('empty_expression')
  }

  override compile(_compiler: Compiler): Type {
    // Does nothing - Intended
    return this.argType
  }
}
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

  override compile(compiler: Compiler, operandType: Type): Type {
    const resultType = operandType.select(this.identifier)
    compiler.instructions.push(
      new LoadConstantInstruction(this.identifier, new StringType()),
      new SelectorOperationInstruction(),
    )
    return resultType
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

  override compile(compiler: Compiler, operandType: Type): Type {
    if (operandType instanceof ArrayType || operandType instanceof SliceType) {
      this.compileIndex(compiler, this.from)
      this.compileIndex(compiler, this.to)
      compiler.instructions.push(new SliceOperationInstruction())
      return new SliceType(operandType.element)
    }
    throw new Error(`Invalid operation: Cannot slice ${operandType}`)
  }

  private compileIndex(compiler: Compiler, index: ExpressionToken | null) {
    if (index) index.compile(compiler)
    else {
      // Use a non integer type to represent the default value for the index.
      compiler.instructions.push(
        new LoadConstantInstruction(false, new BoolType()),
      )
    }
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

    // We only implement variadic functions that accept any number of any type of arguments,
    // so variadic functions do not require type checking.
    if (!operandType.variadic) {
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
    if (this.name === 'make') return this.compileMake(compiler)
    else if (this.name === 'Println') return this.compilePrintln(compiler)
    else if (this.name === 'len') return this.compileLen(compiler)
    else if (this.name === 'cap') return this.compileCap(compiler)
    else {
      throw new Error(`Builtin function ${this.name} is not yet implemented.`)
    }
  }

  private compileCap(compiler: Compiler): Type {
    if (this.args.length !== 1) {
      this.throwArgumentLengthError('cap', 1, this.args.length)
    }
    const argType = this.args[0].compile(compiler)
    if (argType instanceof ArrayType || argType instanceof SliceType) {
      compiler.instructions.push(new BuiltinCapInstruction())
    } else {
      this.throwArgumentTypeError('cap', argType)
    }
    return new Int64Type()
  }

  private compileLen(compiler: Compiler): Type {
    if (this.args.length !== 1) {
      this.throwArgumentLengthError('len', 1, this.args.length)
    }
    const argType = this.args[0].compile(compiler)
    if (argType instanceof ArrayType || argType instanceof SliceType) {
      compiler.instructions.push(new BuiltinLenInstruction())
    } else {
      this.throwArgumentTypeError('len', argType)
    }
    return new Int64Type()
  }

  private compileMake(compiler: Compiler): Type {
    const typeArg = (this.firstTypeArg as TypeToken).compile(compiler)
    if (!(typeArg instanceof SliceType || typeArg instanceof ChannelType)) {
      throw new Error(
        `Invalid argument: cannot make ${typeArg}; type must be slice, map, or channel`,
      )
    }
    if (typeArg instanceof ChannelType) {
      if (this.args.length === 0)
        compiler.instructions.push(
          new LoadConstantInstruction(0, new Int64Type()),
        )
      else {
        const buffer_sz = this.args[0].compile(compiler)
        if (!(buffer_sz instanceof Int64Type)) {
          throw new Error(`Non-integer condition in channel buffer size`)
        }
      }
    }
    // !TODO Make for slice
    compiler.instructions.push(new LoadChannelInstruction())
    return typeArg
  }

  private compilePrintln(compiler: Compiler): Type {
    //! TODO: This should be fmt.Println.
    for (const arg of this.args) arg.compile(compiler)
    compiler.instructions.push(
      new LoadConstantInstruction(this.args.length, new Int64Type()),
    )
    compiler.instructions.push(new PrintInstruction())
    return new NoType()
  }

  private throwArgumentLengthError(
    name: string,
    expectedNum: number,
    actualNum: number,
  ) {
    const errorMessage =
      expectedNum < actualNum
        ? `Invalid operation: too many arguments for ${name} (expected ${expectedNum}, found ${actualNum})`
        : `Invalid operation: not enough arguments for ${name} (expected ${expectedNum}, found ${actualNum})`
    throw new Error(errorMessage)
  }

  private throwArgumentTypeError(name: string, type: Type) {
    const errorMessage = `Invalid argument: (${type}) for ${name}`
    throw new Error(errorMessage)
  }
}
