import { Compiler } from '../../compiler'
import {
  BlockInstruction,
  ExitBlockInstruction,
} from '../../compiler/instructions'
import { NoType, ReturnType, Type } from '../../compiler/typing'

import { Token } from './base'
import { StatementToken } from './statement'

export class BlockToken extends Token {
  constructor(public statements: StatementToken[]) {
    super('block')
  }

  override compile(compiler: Compiler): Type {
    compiler.context.push_env()
    const block_instr = new BlockInstruction('BLOCK')
    compiler.instructions.push(block_instr)
    compiler.type_environment = compiler.type_environment.extend()
    let hasReturn = false
    for (const sub_token of this.statements) {
      const statementType = sub_token.compile(compiler)
      hasReturn ||= statementType instanceof ReturnType
    }
    const blockType = hasReturn
      ? compiler.type_environment.expectedReturn
      : new NoType()

    const vars = compiler.context.env.get_frame()
    block_instr.set_frame(
      vars.map((name) => compiler.type_environment.get(name)),
    )
    block_instr.set_identifiers(vars)
    compiler.type_environment = compiler.type_environment.pop()
    compiler.context.pop_env()

    compiler.instructions.push(new ExitBlockInstruction())

    return blockType
  }
}
