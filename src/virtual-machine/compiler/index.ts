import {
  BinaryOperator,
  BlockToken,
  FunctionDeclarationToken,
  LiteralToken,
  PrimaryExpressionToken,
  SourceFileToken,
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
    if (token instanceof BlockToken) {
      // TODO: Implement Environment
      // Currently assumes no variables and only one block
      for (const sub_token of token.statements) {
        this.compile(sub_token)
      }
    } else if (token instanceof PrimaryExpressionToken) {
      this.compile(token.operand)
    } else if (BinaryOperator.is(token)) {
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
    // TODO: Implement Calling of main function from function declaration
    // Pending Function Signature Tokenisation
    if (token instanceof SourceFileToken) {
      for (let i = 0; i < token.declarations.length; i++) {
        const sub_token = token.declarations[i]
        if (sub_token instanceof FunctionDeclarationToken) {
          if (sub_token.name.identifier === 'main') {
            if (!sub_token.body) throw Error('Main Body Empty')
            this.compile(sub_token.body)
          }
        }
      }
    }
    this.instructions.push(new DoneInstruction())
  }
}

const compile_tokens = (token: Token) => {
  const compiler = new Compiler()
  compiler.compile_program(token)
  return compiler.instructions
}

export { compile_tokens }
