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
  isExpressionToken,
  PrimaryExpressionToken,
  ReturnStatementToken,
  ShortVariableDeclarationToken,
  SourceFileToken,
  StringLiteralToken,
  Token,
  UnaryOperator,
  VariableDeclarationToken,
} from '../parser/tokens'

import {
  ExitLoopInstruction,
  JumpIfFalseInstruction,
  JumpInstruction,
} from './instructions/control'
import { TypeEnvironment } from './typing/type_environment'
import { CompileContext } from './environment'
import {
  BinaryInstruction,
  BlockInstruction,
  DataType,
  DoneInstruction,
  ExitBlockInstruction,
  Instruction,
  LoadConstantInstruction,
  LoadVariableInstruction,
  PopInstruction,
  ReturnInstruction,
  StoreInstruction,
  // SetTypeInstruction,
  UnaryInstruction,
} from './instructions'
import { Float64Type, Int64Type, NoType, StringType, Type } from './typing'

class Compiler {
  instructions: Instruction[] = []
  context = new CompileContext()
  type_environment = new TypeEnvironment()

  compile(token: Token): Type {
    if (token instanceof BlockToken) {
      this.context.push_env()
      const block_instr = new BlockInstruction()
      this.instructions.push(block_instr)
      this.type_environment = this.type_environment.extend()
      for (const sub_token of token.statements) {
        this.compile(sub_token)
        if (isExpressionToken(sub_token))
          this.instructions.push(new PopInstruction())
      }
      const vars = this.context.env.get_frame()
      block_instr.set_frame(vars.map((name) => this.type_environment.get(name)))
      this.type_environment = this.type_environment.pop()
      this.context.pop_env()

      this.instructions.push(new ExitBlockInstruction())

      return new NoType()
    } else if (token instanceof ShortVariableDeclarationToken) {
      const { identifiers, expressions } = token
      for (let i = 0; i < identifiers.length; i++) {
        const var_name = identifiers[i].identifier
        const expr = expressions[i]
        const [frame_idx, var_idx] = this.context.env.declare_var(var_name)
        const expressionType = this.compile(expr)
        this.type_environment.addType(var_name, expressionType)
        this.instructions.push(new LoadVariableInstruction(frame_idx, var_idx))
        this.instructions.push(new StoreInstruction())
      }
      return new NoType()
    } else if (token instanceof VariableDeclarationToken) {
      const { identifiers, varType, expressions } = token
      if (varType === undefined && expressions === undefined) {
        //! TODO (P5): Golang implements this as a syntax error. Unfortunately, our current parsing
        //! is unable to detect this error. A correct parser should require one of them to be present.
        throw Error(
          'Either variable type or assignment value(s) must be defined in variable declaration.',
        )
      }

      // Add identifiers to environment.
      for (const identifier of identifiers) {
        this.context.env.declare_var(identifier.identifier)
      }

      const expectedType = varType ? Type.fromToken(varType) : undefined

      // Compile and add identifiers to type environment.
      if (expressions) {
        if (identifiers.length !== expressions.length) {
          throw Error(
            `Assignment mismatch: ${identifiers.length} variable(s) but ${expressions.length} value(s).`,
          )
        }
        for (let i = 0; i < identifiers.length; i++) {
          const identifier = identifiers[i].identifier
          const expression = expressions[i]
          const [frame_idx, var_idx] = this.context.env.find_var(identifier)
          const expressionType = this.compile(expression)
          if (expectedType && !expectedType.equals(expressionType)) {
            throw Error(
              `Cannot use ${expressionType} as ${expectedType} in variable declaration`,
            )
          }
          this.type_environment.addType(identifier, expressionType)
          this.instructions.push(
            new LoadVariableInstruction(frame_idx, var_idx),
          )
          this.instructions.push(new StoreInstruction())
        }

        return new NoType()
      } else {
        // Variables are uninitialized, but their type is given.
        for (const identifier of identifiers) {
          this.type_environment.addType(
            identifier.identifier,
            expectedType as Type,
          )
        }
      }
    } else if (token instanceof ConstantDeclarationToken) {
      /**
       * TODO: Handle Const separately, several different methods
       *  1. Runtime Const and const tag to variable to make it immutable
       *  2. Compile Time Const: Replace each reference to variable with Expression Token
       *  3. Compile Time Const: Evaluate Expression Token literal value and replace each reference (Golang only allow compile time const)
       */
      const { identifiers, varType, expressions } = token
      const expectedType = varType ? Type.fromToken(varType) : undefined
      for (let i = 0; i < identifiers.length; i++) {
        const var_name = identifiers[i].identifier
        const expr = expressions[i]
        const [frame_idx, var_idx] = this.context.env.declare_var(var_name)
        const expressionType = this.compile(expr)
        if (expectedType && !expressionType.equals(expectedType)) {
          throw Error(
            `Cannot use ${expressionType} as ${expectedType} in constant declaration`,
          )
        }
        this.type_environment.addType(var_name, expressionType)
        this.instructions.push(new LoadVariableInstruction(frame_idx, var_idx))
        this.instructions.push(new StoreInstruction())
      }
    } else if (token instanceof IdentifierToken) {
      const [frame_idx, var_idx] = this.context.env.find_var(token.identifier)
      this.instructions.push(new LoadVariableInstruction(frame_idx, var_idx))
      return this.type_environment.get(token.identifier)
    } else if (token instanceof PrimaryExpressionToken) {
      // TODO: Figure what this does for non-trivial ops like array access and selector
      return this.compile(token.operand)
    } else if (token instanceof AssignmentStatementToken) {
      // TODO: Custom Instructions to avoid recalculation?
      for (let i = 0; i < token.left.length; i++) {
        const left = token.left[i]
        const right = token.right[i]
        let assignType: Type
        if (token.operation === '+=') {
          const leftType = this.compile(left)
          const rightType = this.compile(right)
          if (!leftType.equals(rightType)) {
            throw Error(
              `Invalid operation (mismatched types ${leftType} and ${rightType})`,
            )
          }
          assignType = leftType
          this.instructions.push(new BinaryInstruction('sum'))
        } else if (token.operation === '*=') {
          const leftType = this.compile(left)
          const rightType = this.compile(right)
          if (!leftType.equals(rightType)) {
            throw Error(
              `Invalid operation (mismatched types ${leftType} and ${rightType})`,
            )
          }
          assignType = leftType
          this.instructions.push(new BinaryInstruction('product'))
        } else if (token.operation === '=') {
          assignType = this.compile(right)
        } else {
          throw Error('Unimplemented')
        }
        const varType = this.compile(left)
        if (!varType.equals(assignType)) {
          throw Error(`Cannot use ${assignType} as ${varType} in assignment`)
        }
        this.instructions.push(new StoreInstruction())
      }
      return new NoType()
    } else if (token instanceof IncDecStatementToken) {
      // TODO: Custom Instructions to avoid recalculation?
      this.compile(token.expression)
      this.instructions.push(new LoadConstantInstruction(1, DataType.Number))
      if (token.operation === '++') {
        this.instructions.push(new BinaryInstruction('sum'))
      } else if (token.operation === '--') {
        this.instructions.push(new BinaryInstruction('difference'))
      }
      this.compile(token.expression)
      this.instructions.push(new StoreInstruction())
      return new NoType()
    } else if (token instanceof ReturnStatementToken) {
      // TODO: Implement
      if (token.returns) {
        for (const expr of token.returns) {
          this.compile(expr)
        }
      }
      this.instructions.push(new ReturnInstruction())
    } else if (token instanceof BreakStatementToken) {
      const jumpInstr = new ExitLoopInstruction()
      this.context.add_break(jumpInstr)
      this.instructions.push(jumpInstr)
    } else if (token instanceof ContinueStatementToken) {
      const jumpInstr = new ExitLoopInstruction()
      this.context.add_continue(jumpInstr)
      this.instructions.push(jumpInstr)
    } else if (token instanceof FallthroughStatementToken) {
      // TODO: Implement
    } else if (token instanceof IfStatementToken) {
      this.context.push_env()
      const block_instr = new BlockInstruction()
      this.instructions.push(block_instr)
      this.type_environment = this.type_environment.extend()
      // Initialisation
      if (token.initialization) this.compile(token.initialization)

      // Eval Predicate
      this.compile(token.predicate)
      // If False jump to alternative / end
      const jumpToAlternative = new JumpIfFalseInstruction()

      // Consqeunt Block
      this.instructions.push(jumpToAlternative)
      this.compile(token.consequent)
      const jumpToEnd = new JumpInstruction()
      this.instructions.push(jumpToEnd)

      // Alternative Block
      jumpToAlternative.set_addr(this.instructions.length)
      if (token.alternative) this.compile(token.alternative)
      jumpToEnd.set_addr(this.instructions.length)

      this.instructions.push(new ExitBlockInstruction())
      const vars = this.context.env.get_frame()
      block_instr.set_frame(vars.map((name) => this.type_environment.get(name)))
      this.type_environment = this.type_environment.pop()
      this.context.pop_env()
    } else if (token instanceof ForStatementToken) {
      this.context.push_env()
      this.type_environment = this.type_environment.extend()
      const block_instr = new BlockInstruction(true)
      this.instructions.push(block_instr)
      this.context.push_loop()

      // Initialisation
      if (token.initialization) this.compile(token.initialization)
      const start_addr = this.instructions.length

      // Predicate
      const predicate_false = new JumpIfFalseInstruction()
      if (token.condition) {
        this.compile(token.condition)
        this.instructions.push(predicate_false)
      }

      this.compile(token.body)

      const pre_post_addr = this.instructions.length
      if (token.post) this.compile(token.post)
      this.instructions.push(new JumpInstruction(start_addr))
      const post_post_addr = this.instructions.length
      predicate_false.set_addr(post_post_addr)

      this.context.pop_loop(pre_post_addr, post_post_addr)
      this.instructions.push(new ExitBlockInstruction())
      const vars = this.context.env.get_frame()
      block_instr.set_frame(vars.map((name) => this.type_environment.get(name)))
      this.type_environment = this.type_environment.pop()
      this.context.pop_env()
    } else if (token instanceof DeferStatementToken) {
      // TODO: Implement
    } else if (BinaryOperator.is(token)) {
      const leftType = this.compile(token.children[0])
      const rightType = this.compile(token.children[1])
      if (!leftType.equals(rightType)) {
        throw Error(
          `Invalid operation (mismatched types ${leftType} and ${rightType})`,
        )
      }
      this.instructions.push(new BinaryInstruction(token.name))
      return leftType
    } else if (UnaryOperator.is(token)) {
      const expressionType = this.compile(token.children[0])
      this.instructions.push(new UnaryInstruction(token.name))
      return expressionType
    } else if (token instanceof IntegerLiteralToken) {
      this.instructions.push(
        new LoadConstantInstruction(token.value, DataType.Number),
      )
      return new Int64Type()
    } else if (token instanceof FloatLiteralToken) {
      this.instructions.push(
        new LoadConstantInstruction(token.value, DataType.Float),
      )
      return new Float64Type()
    } else if (token instanceof StringLiteralToken) {
      this.instructions.push(
        new LoadConstantInstruction(token.value, DataType.String),
      )
      return new StringType()
    }
    return new NoType()
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
