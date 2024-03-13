import {
  AssignmentStatementToken,
  BinaryOperator,
  BlockToken,
  BreakStatementToken,
  ConstantDeclarationToken,
  ContinueStatementToken,
  DeferStatementToken,
  FallthroughStatementToken,
  FloatLiteralToken,
  ForStatementToken,
  FunctionDeclarationToken,
  IdentifierToken,
  IfStatementToken,
  IncDecStatementToken,
  IntegerLiteralToken,
  PrimaryExpressionToken,
  ReturnStatementToken,
  ShortVariableDeclarationToken,
  SourceFileToken,
  StringLiteralToken,
  Token,
  UnaryOperator,
  VariableDeclarationToken,
} from '../parser/tokens'

import { CompileEnvironment } from './environment'
import {
  BinaryInstruction,
  BlockInstruction,
  DataType,
  DoneInstruction,
  ExitBlockInstruction,
  Instruction,
  LoadConstantInstruction,
  LoadVariableInstruction,
  StoreInstruction,
  // SetTypeInstruction,
  UnaryInstruction,
} from './instructions'

class Compiler {
  instructions: Instruction[] = []
  env = new CompileEnvironment()
  env_stack = [this.env]
  compile(token: Token) {
    if (token instanceof BlockToken) {
      const new_env = new CompileEnvironment(this.env)
      this.env_stack.push(this.env)
      this.env = new_env

      const block_instr = new BlockInstruction()
      this.instructions.push(block_instr)
      for (const sub_token of token.statements) {
        this.compile(sub_token)
      }

      this.instructions.push(new ExitBlockInstruction())

      block_instr.set_frame_size(this.env.get_frame_size())
      const old_env = this.env_stack.pop()
      if (!old_env) throw Error('Compile Env Stack Empty!')
      this.env = old_env
    } else if (token instanceof ShortVariableDeclarationToken) {
      for (let i = 0; i < token.identifiers.length; i++) {
        const var_name = token.identifiers[i]
        const expr = token.expressions[i]
        const [frame_idx, var_idx] = this.env.declare_var(var_name.identifier)
        this.compile(expr)
        this.instructions.push(new LoadVariableInstruction(frame_idx, var_idx))
        this.instructions.push(new StoreInstruction())
      }
    } else if (token instanceof VariableDeclarationToken) {
      // TODO: Add type to variable
      for (let i = 0; i < token.identifiers.length; i++) {
        const var_name = token.identifiers[i]
        // const [frame_idx, var_idx] =
        this.env.declare_var(var_name.identifier)
        // if(token.varType)
        //   this.instructions.push(new SetTypeInstruction(frame_idx, var_idx))
      }
      if (token.expressions) {
        for (let i = 0; i < token.identifiers.length; i++) {
          const var_name = token.identifiers[i]
          const expr = token.expressions[i]
          const [frame_idx, var_idx] = this.env.find_var(var_name.identifier)
          this.compile(expr)
          this.instructions.push(
            new LoadVariableInstruction(frame_idx, var_idx),
          )
          this.instructions.push(new StoreInstruction())
        }
      }
    } else if (token instanceof ConstantDeclarationToken) {
      /**
       * TODO: Handle Const separately, several different methods
       *  1. Runtime Const and const tag to variable to make it immutable
       *  2. Compile Time Const: Replace each reference to variable with Expression Token
       *  3. Compile Time Const: Evaluate Expression Token literal value and replace each reference (Golang only allow compile time const)
       */
      for (let i = 0; i < token.identifiers.length; i++) {
        const var_name = token.identifiers[i]
        const expr = token.expressions[i]
        const [frame_idx, var_idx] = this.env.declare_var(var_name.identifier)
        this.compile(expr)
        this.instructions.push(new LoadVariableInstruction(frame_idx, var_idx))
        this.instructions.push(new StoreInstruction())
      }
    } else if (token instanceof IdentifierToken) {
      const [frame_idx, var_idx] = this.env.find_var(token.identifier)
      this.instructions.push(new LoadVariableInstruction(frame_idx, var_idx))
    } else if (token instanceof PrimaryExpressionToken) {
      // TODO: Figure what this does
      this.compile(token.operand)
    } else if (token instanceof AssignmentStatementToken) {
      // TODO: Custom Instructions to avoid recalculation?
      for (let i = 0; i < token.left.length; i++) {
        const left = token.left[i]
        const right = token.right[i]
        if (token.operation === '+=') {
          this.compile(left)
          this.compile(right)
          this.instructions.push(new BinaryInstruction('sum'))
        } else if (token.operation === '*=') {
          this.compile(left)
          this.compile(right)
          this.instructions.push(new BinaryInstruction('product'))
        } else if (token.operation === '=') {
          this.compile(right)
        }
        this.compile(left)
        this.instructions.push(new StoreInstruction())
      }
    } else if (token instanceof IncDecStatementToken) {
      // TODO: Figure what this does
      this.compile(token.expression)
      this.instructions.push(new LoadConstantInstruction(1, DataType.Number))
      if (token.operation === '++') {
        this.instructions.push(new BinaryInstruction('sum'))
      } else if (token.operation === '--') {
        this.instructions.push(new BinaryInstruction('difference'))
      }
      this.compile(token.expression)
      this.instructions.push(new StoreInstruction())
    } else if (token instanceof ReturnStatementToken) {
      // TODO: Figure what this does
    } else if (token instanceof BreakStatementToken) {
      // TODO: Figure what this does
    } else if (token instanceof ContinueStatementToken) {
      // TODO: Figure what this does
    } else if (token instanceof FallthroughStatementToken) {
      // TODO: Figure what this does
    } else if (token instanceof IfStatementToken) {
      // TODO: Figure what this does
    } else if (token instanceof ForStatementToken) {
      // TODO: Figure what this does
    } else if (token instanceof DeferStatementToken) {
      // TODO: Figure what this does
    } else if (BinaryOperator.is(token)) {
      this.compile(token.children[0])
      this.compile(token.children[1])
      this.instructions.push(new BinaryInstruction(token.name))
    } else if (UnaryOperator.is(token)) {
      this.compile(token.children[0])
      this.instructions.push(new UnaryInstruction(token.name))
    } else if (token instanceof IntegerLiteralToken) {
      this.instructions.push(
        new LoadConstantInstruction(token.value, DataType.Number),
      )
    } else if (token instanceof FloatLiteralToken) {
      this.instructions.push(
        new LoadConstantInstruction(token.value, DataType.Float),
      )
    } else if (token instanceof StringLiteralToken) {
      this.instructions.push(
        new LoadConstantInstruction(token.value, DataType.String),
      )
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
