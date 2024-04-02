import { Compiler } from '../../compiler'
import {
  BlockInstruction,
  ExitBlockInstruction,
  PopInstruction,
} from '../../compiler/instructions'
import { NoType, Type } from '../../compiler/typing'

import { Token } from './base'
import { isExpressionToken } from './expressions'
import { StatementToken } from './statement'

export class BlockToken extends Token {
  constructor(public statements: StatementToken[]) {
    super('block')
  }

  override compile(compiler: Compiler): Type {
    compiler.context.push_env()
    const block_instr = new BlockInstruction()
    compiler.instructions.push(block_instr)
    compiler.type_environment = compiler.type_environment.extend()
    for (const sub_token of this.statements) {
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

    compiler.instructions.push(new ExitBlockInstruction())

    return new NoType()
  }
}
