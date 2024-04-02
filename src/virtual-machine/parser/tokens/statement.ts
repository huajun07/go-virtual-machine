import { Compiler } from '../../compiler'
import {
  BinaryInstruction,
  BlockInstruction,
  DataType,
  ExitBlockInstruction,
  LoadConstantInstruction,
  ReturnInstruction,
  StoreInstruction,
} from '../../compiler/instructions'
import {
  ExitLoopInstruction,
  JumpIfFalseInstruction,
  JumpInstruction,
} from '../../compiler/instructions/control'
import { NoType, Type } from '../../compiler/typing'

import { Token } from './base'
import { BlockToken } from './block'
import { DeclarationToken, ShortVariableDeclarationToken } from './declaration'
import { ExpressionToken } from './expressions'

//! TODO (P1): Add other types of statements and expressions
export type StatementToken =
  | ExpressionToken
  | SimpleStatementToken
  | DeclarationToken

export type SimpleStatementToken =
  | IncDecStatementToken
  | AssignmentStatementToken
  | ShortVariableDeclarationToken
  | ExpressionToken

export class AssignmentStatementToken extends Token {
  constructor(
    public left: ExpressionToken[],
    public operation: '=' | '+=' | '*=',
    public right: ExpressionToken[],
  ) {
    super('assignment')
  }

  override compile(compiler: Compiler): Type {
    // TODO: Custom Instructions to avoid recalculation?
    for (let i = 0; i < this.left.length; i++) {
      const left = this.left[i]
      const right = this.right[i]
      let assignType: Type
      if (this.operation === '+=') {
        const leftType = left.compile(compiler)
        const rightType = right.compile(compiler)
        if (!leftType.equals(rightType)) {
          throw Error(
            `Invalid operation (mismatched types ${leftType} and ${rightType})`,
          )
        }
        assignType = leftType
        compiler.instructions.push(new BinaryInstruction('sum'))
      } else if (this.operation === '*=') {
        const leftType = left.compile(compiler)
        const rightType = right.compile(compiler)
        if (!leftType.equals(rightType)) {
          throw Error(
            `Invalid operation (mismatched types ${leftType} and ${rightType})`,
          )
        }
        assignType = leftType
        compiler.instructions.push(new BinaryInstruction('product'))
      } else if (this.operation === '=') {
        assignType = right.compile(compiler)
      } else {
        throw Error('Unimplemented')
      }
      const varType = left.compile(compiler)
      if (!varType.equals(assignType)) {
        throw Error(`Cannot use ${assignType} as ${varType} in assignment`)
      }
      compiler.instructions.push(new StoreInstruction())
    }
    return new NoType()
  }
}

export class IncDecStatementToken extends Token {
  constructor(
    public expression: ExpressionToken,
    public operation: '++' | '--',
  ) {
    super('inc_dec')
  }

  override compile(compiler: Compiler): Type {
    // TODO: Custom Instructions to avoid recalculation?
    this.expression.compile(compiler)
    compiler.instructions.push(new LoadConstantInstruction(1, DataType.Number))
    if (this.operation === '++') {
      compiler.instructions.push(new BinaryInstruction('sum'))
    } else if (this.operation === '--') {
      compiler.instructions.push(new BinaryInstruction('difference'))
    }
    this.expression.compile(compiler)
    compiler.instructions.push(new StoreInstruction())
    return new NoType()
  }
}

export class ReturnStatementToken extends Token {
  constructor(public returns?: ExpressionToken[]) {
    super('return')
  }

  override compile(compiler: Compiler): Type {
    // TODO: Implement
    if (this.returns) {
      for (const expr of this.returns) {
        expr.compile(compiler)
      }
    }
    compiler.instructions.push(new ReturnInstruction())
    return new NoType()
  }
}

export class BreakStatementToken extends Token {
  constructor() {
    super('break')
  }

  override compile(compiler: Compiler): Type {
    const jumpInstr = new ExitLoopInstruction()
    compiler.context.add_break(jumpInstr)
    compiler.instructions.push(jumpInstr)
    return new NoType()
  }
}

export class ContinueStatementToken extends Token {
  constructor() {
    super('continue')
  }

  override compile(compiler: Compiler): Type {
    const jumpInstr = new ExitLoopInstruction()
    compiler.context.add_continue(jumpInstr)
    compiler.instructions.push(jumpInstr)
    return new NoType()
  }
}

export class FallthroughStatementToken extends Token {
  constructor() {
    super('fallthrough')
  }

  override compile(_compiler: Compiler): Type {
    // TODO: Implement
    return new NoType()
  }
}

export class IfStatementToken extends Token {
  constructor(
    /** Executed before the predicate (e.g. if x := 0; x < 1 {} ) */
    public initialization: SimpleStatementToken | null,
    public predicate: ExpressionToken,
    public consequent: BlockToken,
    public alternative: IfStatementToken | BlockToken | null,
  ) {
    super('if')
  }

  override compile(compiler: Compiler): Type {
    compiler.context.push_env()
    const block_instr = new BlockInstruction()
    compiler.instructions.push(block_instr)
    compiler.type_environment = compiler.type_environment.extend()
    // Initialisation
    if (this.initialization) this.initialization.compile(compiler)

    // Eval Predicate
    this.predicate.compile(compiler)
    // If False jump to alternative / end
    const jumpToAlternative = new JumpIfFalseInstruction()

    // Consequent Block
    compiler.instructions.push(jumpToAlternative)
    this.consequent.compile(compiler)
    const jumpToEnd = new JumpInstruction()
    compiler.instructions.push(jumpToEnd)

    // Alternative Block
    jumpToAlternative.set_addr(compiler.instructions.length)
    if (this.alternative) this.alternative.compile(compiler)
    jumpToEnd.set_addr(compiler.instructions.length)

    compiler.instructions.push(new ExitBlockInstruction())
    const vars = compiler.context.env.get_frame()
    block_instr.set_frame(
      vars.map((name) => compiler.type_environment.get(name)),
    )
    compiler.type_environment = compiler.type_environment.pop()
    compiler.context.pop_env()
    return new NoType()
  }
}

export class SwitchStatementToken extends Token {
  constructor(
    public init: SimpleStatementToken | null,
    public expressions: ExpressionToken | null,
    public cases: SwitchCaseToken[],
  ) {
    super('switch')
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    return new NoType()
  }
}

export class SwitchCaseToken extends Token {
  constructor(
    public expressions: ExpressionToken[] | null,
    public statements: StatementToken[],
  ) {
    super('case')
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    return new NoType()
  }
}

export class ForStatementToken extends Token {
  // There are 4 types of for loops:
  // 1. For statement that iterates the body repeatedly.
  // 2. For statements with a single condition.
  // 3. For statements with a for clause (init, condition, post).
  // 4. For statements with a range clause.
  //! Note that range clauses are not supported for now. They will likely be a seperate class.
  constructor(
    public initialization: SimpleStatementToken | null,
    public condition: ExpressionToken | null,
    public post: ExpressionToken | null,
    public body: BlockToken,
  ) {
    super('for')
  }

  override compile(compiler: Compiler): Type {
    compiler.context.push_env()
    compiler.type_environment = compiler.type_environment.extend()
    const block_instr = new BlockInstruction(true)
    compiler.instructions.push(block_instr)
    compiler.context.push_loop()

    // Initialisation
    if (this.initialization) this.initialization.compile(compiler)
    const start_addr = compiler.instructions.length

    // Predicate
    const predicate_false = new JumpIfFalseInstruction()
    if (this.condition) {
      this.condition.compile(compiler)
      compiler.instructions.push(predicate_false)
    }

    this.body.compile(compiler)

    const pre_post_addr = compiler.instructions.length
    if (this.post) this.post.compile(compiler)
    compiler.instructions.push(new JumpInstruction(start_addr))
    const post_post_addr = compiler.instructions.length
    predicate_false.set_addr(post_post_addr)

    compiler.context.pop_loop(pre_post_addr, post_post_addr)
    compiler.instructions.push(new ExitBlockInstruction())
    const vars = compiler.context.env.get_frame()
    block_instr.set_frame(
      vars.map((name) => compiler.type_environment.get(name)),
    )
    compiler.type_environment = compiler.type_environment.pop()
    compiler.context.pop_env()
    return new NoType()
  }
}

export class DeferStatementToken extends Token {
  constructor(public expression: ExpressionToken) {
    super('defer')
  }

  override compile(_compiler: Compiler): Type {
    // TODO: Implement
    return new NoType()
  }
}
