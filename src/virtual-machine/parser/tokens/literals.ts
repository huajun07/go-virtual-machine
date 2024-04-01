import { Compiler } from 'src/virtual-machine/compiler'
import {
  DataType,
  LoadConstantInstruction,
} from 'src/virtual-machine/compiler/instructions'
import {
  Float64Type,
  Int64Type,
  StringType,
  Type,
} from 'src/virtual-machine/compiler/typing'

import { Token } from './base'

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
      new LoadConstantInstruction(this.value, DataType.Number),
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
      new LoadConstantInstruction(this.value, DataType.Float),
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
      new LoadConstantInstruction(this.value, DataType.String),
    )
    return new StringType()
  }
}
