import { Token } from '../parser/tokens'

import { TypeEnvironment } from './typing/type_environment'
import { CompileContext } from './environment'
import { DoneInstruction, Instruction } from './instructions'

export class Compiler {
  instructions: Instruction[] = []
  context = new CompileContext()
  type_environment = new TypeEnvironment()

  compile_program(token: Token) {
    token.compileUnchecked(this)
    this.instructions.push(new DoneInstruction())
  }
}

const compile_tokens = (token: Token) => {
  const compiler = new Compiler()
  compiler.compile_program(token)
  return compiler.instructions
}

export { compile_tokens }
