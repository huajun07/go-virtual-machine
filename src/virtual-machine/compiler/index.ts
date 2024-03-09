import {
  BinaryOperator,
  LiteralToken,
  Token,
  UnaryOperator,
} from '../parser/tokens'

type OpInstruction = {
  tag: 'BINOP' | 'UNOP'
  op: string
}

type LoadConstantInstruction = {
  tag: 'LDC'
  val: unknown
}

type DoneInstruction = {
  tag: 'DONE'
}

type Instruction = OpInstruction | LoadConstantInstruction | DoneInstruction

class Compiler {
  instructions: Instruction[] = []
  compile(token: Token) {
    if (BinaryOperator.is(token)) {
      this.compile(token.children[0])
      this.compile(token.children[1])
      this.instructions.push({ tag: 'BINOP', op: token.name })
    } else if (UnaryOperator.is(token)) {
      this.compile(token.children[0])
      this.instructions.push({ tag: 'UNOP', op: token.name })
    } else if (LiteralToken.is(token)) {
      this.instructions.push({ tag: 'LDC', val: token.value })
    }
  }

  compile_program(token: Token) {
    this.compile(token)
    this.instructions.push({ tag: 'DONE' })
  }
}

const compile_tokens = (token: Token) => {
  const compiler = new Compiler()
  compiler.compile_program(token)
  return compiler.instructions
}

export {
  compile_tokens,
  type Instruction,
  type LoadConstantInstruction,
  type OpInstruction,
}
