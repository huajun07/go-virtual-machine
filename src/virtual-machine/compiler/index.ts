import {
  BinaryOperator,
  LiteralToken,
  Token,
  UnaryOperator,
} from '../parser/tokens'

import {
  BinaryInstruction,
  DoneInstruction,
  Instruction,
  LoadConstantInstruction,
  UnaryInstruction,
} from './instructions'

class Compiler {
  instructions: Instruction[] = []
  compile(token: Token) {
    if (BinaryOperator.is(token)) {
      this.compile(token.children[0])
      this.compile(token.children[1])
      this.instructions.push(new BinaryInstruction(token.name))
    } else if (UnaryOperator.is(token)) {
      this.compile(token.children[0])
      this.instructions.push(new UnaryInstruction(token.name))
    } else if (LiteralToken.is(token)) {
      this.instructions.push(new LoadConstantInstruction(token.value))
    }
  }

  compile_program(token: Token) {
    this.compile(token)
    this.instructions.push(new DoneInstruction())
  }
}

const compile_tokens = (token: Token) => {
  const compiler = new Compiler()
  compiler.compile_program(token)
  return compiler.instructions
}

export { compile_tokens }
