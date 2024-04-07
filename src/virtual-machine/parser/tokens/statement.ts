import { Compiler } from '../../compiler'
import {
  BinaryInstruction,
  BlockInstruction,
  DoneInstruction,
  ExitBlockInstruction,
  ForkInstruction,
  LoadChannelReqInstruction,
  LoadConstantInstruction,
  PopInstruction,
  ReturnInstruction,
  SelectInstruction,
  StoreInstruction,
} from '../../compiler/instructions'
import {
  ExitLoopInstruction,
  JumpIfFalseInstruction,
  JumpInstruction,
} from '../../compiler/instructions/control'
import {
  BoolType,
  Int64Type,
  NoType,
  ReturnType,
  Type,
} from '../../compiler/typing'

import { Token } from './base'
import { BlockToken } from './block'
import { DeclarationToken, ShortVariableDeclarationToken } from './declaration'
import {
  CallToken,
  ExpressionToken,
  PrimaryExpressionToken,
} from './expressions'
import { IdentifierToken } from './identifier'

export type StatementToken =
  | DeclarationToken
  | SimpleStatementToken
  | GoStatementToken
  | ReturnStatementToken
  | BreakStatementToken
  | ContinueStatementToken
  | FallthroughStatementToken
  | BlockToken
  | IfStatementToken
  | SwitchStatementToken
  | SelectStatementToken
  | ForStatementToken
  | DeferStatementToken

export type SimpleStatementToken =
  | ExpressionStatementToken
  | SendStatementToken
  | IncDecStatementToken
  | AssignmentStatementToken
  | ShortVariableDeclarationToken

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
      if (!varType.assignableBy(assignType)) {
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
    compiler.instructions.push(new LoadConstantInstruction(1, new Int64Type()))
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
    const returnType = new ReturnType(
      (this.returns ?? []).map((expr) => expr.compile(compiler)),
    )

    if (
      returnType.types.length >
      compiler.type_environment.expectedReturn.types.length
    ) {
      throw new Error(
        `Too many return values\nhave ${returnType}\nwant ${compiler.type_environment.expectedReturn}`,
      )
    }

    if (!returnType.equals(compiler.type_environment.expectedReturn)) {
      throw new Error(
        `Cannot use ${returnType} as ${compiler.type_environment.expectedReturn} value in return statement.`,
      )
    }

    compiler.instructions.push(new ReturnInstruction())
    return returnType
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
    const predicateType = this.predicate.compile(compiler)
    if (!(predicateType instanceof BoolType)) {
      throw new Error(`Non-boolean condition in if statement.`)
    }
    // If False jump to alternative / end
    const jumpToAlternative = new JumpIfFalseInstruction()

    // Consequent Block
    compiler.instructions.push(jumpToAlternative)
    const consequentType = this.consequent.compile(compiler)
    const jumpToEnd = new JumpInstruction()
    compiler.instructions.push(jumpToEnd)

    // Alternative Block
    jumpToAlternative.set_addr(compiler.instructions.length)
    // AlternativeType defaults to the expected return type, so that if there is no alternative,
    // we simply treat the consequent type as the type of the whole if statement.
    let alternativeType: Type = compiler.type_environment.expectedReturn
    if (this.alternative) alternativeType = this.alternative.compile(compiler)
    jumpToEnd.set_addr(compiler.instructions.length)

    compiler.instructions.push(new ExitBlockInstruction())
    const vars = compiler.context.env.get_frame()
    block_instr.set_frame(
      vars.map((name) => compiler.type_environment.get(name)),
    )
    compiler.type_environment = compiler.type_environment.pop()
    compiler.context.pop_env()

    if (
      consequentType instanceof ReturnType &&
      alternativeType instanceof ReturnType
    ) {
      return consequentType
    }
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
      const predicateType = this.condition.compile(compiler)
      if (!(predicateType instanceof BoolType)) {
        throw new Error(`Non-boolean condition in for statement condition.`)
      }
      compiler.instructions.push(predicate_false)
    }

    const bodyType = this.body.compile(compiler)

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
    return bodyType
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

export class GoStatementToken extends Token {
  constructor(public call: PrimaryExpressionToken) {
    super('go')
  }

  /** Used in the parser to only parse function calls */
  static isValidGoroutine(expression: PrimaryExpressionToken) {
    return (
      expression.rest &&
      expression.rest.length > 0 &&
      expression.rest[expression.rest.length - 1] instanceof CallToken
    )
  }

  override compile(compiler: Compiler): Type {
    const fork_instr = new ForkInstruction()
    compiler.instructions.push(fork_instr)
    this.call.compile(compiler)
    compiler.instructions.push(new DoneInstruction())
    fork_instr.set_addr(compiler.instructions.length)
    return new NoType()
  }
}

/** Sends a `value` into `channel`. */
export class SendStatementToken extends Token {
  constructor(public channel: IdentifierToken, public value: ExpressionToken) {
    super('send')
  }

  override compile(compiler: Compiler): Type {
    this.value.compile(compiler)
    this.channel.compile(compiler)
    compiler.instructions.push(new LoadChannelReqInstruction(false))
    return new NoType()
  }
}

/** Receive and assign the results to one or two variables. Note that RecvStmt is NOT a SimpleStmt. */
export class ReceiveStatementToken extends Token {
  constructor(
    public identifiers: IdentifierToken[] | null,
    public channel: ExpressionToken,
  ) {
    super('receive')
  }

  /** Used in the parser to only parse valid receive statements. */
  static isReceiveStatement(identifiers: IdentifierToken[] | null) {
    return (
      identifiers === null ||
      (identifiers.length > 0 && identifiers.length <= 2)
    )
  }

  override compile(compiler: Compiler): Type {
    this.channel.compile(compiler)
    // !TODO: Figure out whats happening here
    compiler.instructions.push(new LoadChannelReqInstruction(true))
    return new NoType()
  }
}

export class SelectStatementToken extends Token {
  constructor(public clauses: CommunicationClauseToken[]) {
    super('select')
  }

  override compile(compiler: Compiler): Type {
    let default_case = false
    const end_jumps = []
    for (const clause of this.clauses) {
      if (clause.predicate === 'default') {
        if (default_case) throw Error('Multiple Default cases!')
        default_case = true
        continue
      }
      clause.compile(compiler)
      const jump_instr = new JumpInstruction()
      compiler.instructions.push(jump_instr)
      end_jumps.push(jump_instr)
    }
    if (default_case) {
      for (const clause of this.clauses) {
        if (clause.predicate === 'default') {
          clause.compile(compiler)
          const jump_instr = new JumpInstruction()
          compiler.instructions.push(jump_instr)
          end_jumps.push(jump_instr)
        }
      }
    }
    compiler.instructions.push(
      new SelectInstruction(
        this.clauses.length - (default_case ? 1 : 0),
        default_case,
      ),
    )
    for (const jump_instr of end_jumps)
      jump_instr.set_addr(compiler.instructions.length)

    return new NoType()
  }
}
export class CommunicationClauseToken extends Token {
  constructor(
    public predicate: 'default' | SendStatementToken | ReceiveStatementToken,
    public body: StatementToken[],
  ) {
    super('communication_clause')
  }

  override compile(compiler: Compiler): Type {
    if (this.predicate === 'default') {
      const load_instr = new LoadConstantInstruction(
        compiler.instructions.length + 2,
        new Int64Type(),
      )
      compiler.instructions.push(load_instr)
      const jump_instr = new JumpInstruction()
      compiler.instructions.push(jump_instr)
      new BlockToken(this.body).compile(compiler)
      jump_instr.set_addr(compiler.instructions.length + 1)
    } else {
      // !TODO: Settle non-default cases
    }
    return new NoType()
  }
}

/** An ExpressionStatement differs from an Expression: it should not leave a value on the OS. */
export class ExpressionStatementToken extends Token {
  constructor(public expression: ExpressionToken) {
    super('expression_statement')
  }

  override compile(compiler: Compiler): Type {
    this.expression.compile(compiler)
    compiler.instructions.push(new PopInstruction())
    return new NoType()
  }
}
