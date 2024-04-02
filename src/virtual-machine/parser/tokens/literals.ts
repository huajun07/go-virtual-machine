import { Compiler } from '../../compiler'
import {
  DataType,
  FuncBlockInstruction,
  JumpInstruction,
  LoadConstantInstruction,
  LoadFuncInstruction,
  PopInstruction,
  ReturnInstruction,
} from '../../compiler/instructions'
import { Float64Type, Int64Type, StringType, Type } from '../../compiler/typing'

import { Token } from './base'
import { BlockToken } from './block'
import { isExpressionToken } from './expressions'
import { FunctionTypeToken } from './type'

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
    compiler.type_environment = compiler.type_environment.extend()

    let cnt = 0
    for (const param of this.signature.parameters) {
      const name = param.identifier || (cnt++).toString()
      compiler.context.env.declare_var(name)
      compiler.type_environment.addType(name, param.type.compile(compiler))
    }

    for (const sub_token of this.body.statements) {
      sub_token.compile(compiler)
      if (isExpressionToken(sub_token))
        compiler.instructions.push(new PopInstruction())
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
    return this.signature.compile(compiler)
  }
}
