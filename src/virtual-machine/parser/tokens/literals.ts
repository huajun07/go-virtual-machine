import { Compiler } from '../../compiler'
import {
  FuncBlockInstruction,
  JumpInstruction,
  LoadArrayInstruction,
  LoadConstantInstruction,
  LoadDefaultInstruction,
  LoadFuncInstruction,
  PopInstruction,
  ReturnInstruction,
} from '../../compiler/instructions'
import {
  ArrayType,
  Float64Type,
  Int64Type,
  ReturnType,
  StringType,
  Type,
} from '../../compiler/typing'

import { Token } from './base'
import { BlockToken } from './block'
import { ExpressionToken, isExpressionToken } from './expressions'
import { ArrayTypeToken, FunctionTypeToken } from './type'

export abstract class LiteralToken extends Token {
  constructor(public value: number | string) {
    super('literal')
  }

  static is(token: Token): token is LiteralToken {
    return token.type === 'literal'
  }
}

export class IntegerLiteralToken extends LiteralToken {
  /** Tokenize an integer literal in the given base. */
  static fromSource(str: string, base: number) {
    // Golang numbers can be underscore delimited.
    const value = parseInt(str.replace('_', ''), base)
    return new IntegerLiteralToken(value)
  }

  getValue(): number {
    return this.value as number
  }

  override compile(compiler: Compiler): Type {
    compiler.instructions.push(
      new LoadConstantInstruction(this.value, new Int64Type()),
    )
    return new Int64Type()
  }
}

export class FloatLiteralToken extends LiteralToken {
  /** Tokenize a float literal. */
  static fromSource(str: string) {
    const value = parseFloat(str)
    return new FloatLiteralToken(value)
  }

  getValue(): number {
    return this.value as number
  }

  override compile(compiler: Compiler): Type {
    compiler.instructions.push(
      new LoadConstantInstruction(this.value, new Float64Type()),
    )
    return new Float64Type()
  }
}

export class StringLiteralToken extends LiteralToken {
  /** Tokenize a raw string literal. */
  static fromSourceRaw(str: string) {
    // Carriage returns are discarded from raw strings.
    str = str.replaceAll('\r', '')
    return new StringLiteralToken(str)
  }

  /** Tokenize an interpreted string literal. */
  static fromSourceInterpreted(str: string) {
    return new StringLiteralToken(str)
  }

  getValue(): string {
    return this.value as string
  }

  override compile(compiler: Compiler): Type {
    compiler.instructions.push(
      new LoadConstantInstruction(this.value, new StringType()),
    )
    return new StringType()
  }
}

export class FunctionLiteralToken extends Token {
  constructor(public signature: FunctionTypeToken, public body: BlockToken) {
    super('function_literal')
  }

  override compile(compiler: Compiler): Type {
    compiler.context.push_env()
    const jump_instr = new JumpInstruction()
    compiler.instructions.push(jump_instr)
    const func_start = compiler.instructions.length
    const block_instr = new FuncBlockInstruction(
      this.signature.parameters.length,
    )
    compiler.instructions.push(block_instr)

    const signatureType = this.signature.compile(compiler)
    compiler.type_environment = compiler.type_environment.extend()
    compiler.type_environment.updateReturnType(signatureType.results)

    let cnt = 0
    for (const param of this.signature.parameters) {
      const name = param.identifier || (cnt++).toString()
      compiler.context.env.declare_var(name)
      compiler.type_environment.addType(name, param.type.compile(compiler))
    }

    let hasReturn = false
    for (const sub_token of this.body.statements) {
      const statementType = sub_token.compile(compiler)
      hasReturn ||= statementType instanceof ReturnType
    }
    const vars = compiler.context.env.get_frame()
    block_instr.set_frame(
      vars.map((name) => compiler.type_environment.get(name)),
    )
    compiler.type_environment = compiler.type_environment.pop()
    compiler.context.pop_env()

    compiler.instructions.push(new ReturnInstruction())
    jump_instr.set_addr(compiler.instructions.length)
    compiler.instructions.push(new LoadFuncInstruction(func_start))

    if (!hasReturn && signatureType.results.types.length > 0) {
      throw new Error(`Missing return.`)
    }
    return signatureType
  }
}

export class LiteralValueToken extends Token {
  constructor(public elements: (LiteralValueToken | ExpressionToken)[]) {
    super('literal_value')
  }

  override compile(_compiler: Compiler): Type {
    throw new Error(
      'Do not use LiteralValueToken.compile, instead use LiteralValueToken.compileWithType',
    )
  }

  //! TODO (P5): It is extremely weird to define a separate compilation method,
  //! but we need the extra type information here. How to fix this?
  compileWithType(compiler: Compiler, type: Type) {
    if (type instanceof ArrayType) {
      if (this.elements.length > type.length) {
        throw new Error(
          `Array literal has ${this.elements.length} elements but only expected ${type.length}, in type ${type}.`,
        )
      }

      for (const element of this.elements) {
        if (element instanceof LiteralValueToken) {
          element.compileWithType(compiler, type.element)
        } else {
          const actualType = element.compile(compiler)
          if (!type.element.equals(actualType)) {
            throw new Error(
              `Cannot use ${actualType} as ${type.element} value in array literal.`,
            )
          }
        }
      }
      for (let i = 0; i < type.length - this.elements.length; i++) {
        // Ran out of literal values, use the default values.
        compiler.instructions.push(new LoadDefaultInstruction(type.element))
      }

      compiler.instructions.push(new LoadArrayInstruction(type.length))
    } else {
      throw new Error('Parser Bug: Type of literal value is not supported.')
    }
  }
}

export class ArrayLiteralToken extends Token {
  constructor(
    public arrayType: ArrayTypeToken,
    public body: LiteralValueToken,
  ) {
    super('array_literal')
  }

  override compile(compiler: Compiler): Type {
    const type = this.arrayType.compile(compiler)
    this.body.compileWithType(compiler, type)
    return type
  }
}
