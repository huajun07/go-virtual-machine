import { Compiler } from '../../compiler'
import {
  BinaryInstruction,
  BlockInstruction,
  CallInstruction,
  DeferredCallInstruction,
  DoneInstruction,
  ExitBlockInstruction,
  ForkInstruction,
  LoadChannelReqInstruction,
  LoadConstantInstruction,
  PopInstruction,
  ReturnInstruction,
  SelectInstruction,
  StoreInstruction,
  TryChannelReqInstruction,
} from '../../compiler/instructions'
import {
  ExitLoopInstruction,
  JumpIfFalseInstruction,
  JumpInstruction,
} from '../../compiler/instructions/control'
import {
  BoolType,
  ChannelType,
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
  EmptyExpressionToken,
  ExpressionToken,
  PrimaryExpressionToken,
} from './expressions'
import { IdentifierToken } from './identifier'
import { UnaryOperator } from './operator'

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
    const block_instr = new BlockInstruction('IF BLOCK')
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
    this.consequent.name = 'IF BODY'
    const consequentType = this.consequent.compile(compiler)
    const jumpToEnd = new JumpInstruction()
    compiler.instructions.push(jumpToEnd)

    // Alternative Block
    jumpToAlternative.set_addr(compiler.instructions.length)
    // AlternativeType defaults to the expected return type, so that if there is no alternative,
    // we simply treat the consequent type as the type of the whole if statement.
    let alternativeType: Type = compiler.type_environment.expectedReturn
    if (this.alternative) {
      if (this.alternative instanceof BlockInstruction)
        this.alternative.name = 'IF BODY'
      alternativeType = this.alternative.compile(compiler)
    }
    jumpToEnd.set_addr(compiler.instructions.length)

    compiler.instructions.push(new ExitBlockInstruction())
    const vars = compiler.context.env.get_frame()
    block_instr.set_frame(
      vars.map((name) => compiler.type_environment.get(name)),
    )
    block_instr.set_identifiers(vars)
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
    const block_instr = new BlockInstruction('FOR INIT', true)
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
    this.body.name = 'FOR BODY'
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
    block_instr.set_identifiers(vars)
    compiler.type_environment = compiler.type_environment.pop()
    compiler.context.pop_env()
    return bodyType
  }
}

export class DeferStatementToken extends Token {
  constructor(public expression: ExpressionToken) {
    super('defer')
  }

  override compile(compiler: Compiler): Type {
    if (!this.isFunctionCall()) {
      throw new Error('Expression in defer must be function call.')
    }

    this.expression.compile(compiler)
    const call = compiler.instructions[compiler.instructions.length - 1]
    compiler.instructions[compiler.instructions.length - 1] =
      DeferredCallInstruction.fromCallInstruction(call as CallInstruction)

    return new NoType()
  }

  private isFunctionCall(): boolean {
    if (!(this.expression instanceof PrimaryExpressionToken)) return false
    const modifiers = this.expression.rest ?? []
    if (modifiers.length === 0) return false
    if (!(modifiers[modifiers.length - 1] instanceof CallToken)) return false
    return true
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
    const chanType = this.channel.compile(compiler)
    if (!(chanType instanceof ChannelType))
      throw Error('Not instance of channel type')
    const argType = chanType.element
    const exprType = this.value.compile(compiler)
    if (!argType.assignableBy(exprType)) {
      throw Error(`Cannot use ${exprType} as ${argType} in assignment`)
    }
    if (!argType.equals(exprType)) throw Error('')
    compiler.instructions.push(
      new LoadChannelReqInstruction(false, compiler.instructions.length + 2),
    )
    compiler.instructions.push(new TryChannelReqInstruction())
    return new NoType()
  }
}

/** Receive and assign the results to one or two variables. Note that RecvStmt is NOT a SimpleStmt. */
export class ReceiveStatementToken extends Token {
  constructor(
    /** Whether this is a shorthand variable declaration (else it is an assignment). */
    public declaration: boolean,
    public identifiers: IdentifierToken[] | null,
    /** expression is guarenteed to be a receive operator. */
    public expression: UnaryOperator,
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
    const chanType = this.expression.compile(compiler)
    return chanType
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
          break
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
    if (!(this.predicate instanceof ReceiveStatementToken)) {
      if (this.predicate === 'default') {
        const load_instr = new LoadConstantInstruction(
          compiler.instructions.length + 2,
          new Int64Type(),
        )
        compiler.instructions.push(load_instr)
      } else {
        // Is send statement
        this.predicate.compile(compiler)
        compiler.instructions.pop() // Removing blocking op
      }
      const jump_instr = new JumpInstruction()
      compiler.instructions.push(jump_instr)
      new BlockToken(this.body, 'CASE BLOCK').compile(compiler)
      jump_instr.set_addr(compiler.instructions.length + 1)
    } else {
      // This is recv statement
      const chanType = this.predicate.expression.compile(compiler)
      compiler.instructions.pop()
      const jump_instr = new JumpInstruction()
      compiler.instructions.push(jump_instr)
      if (this.predicate.identifiers) {
        if (this.predicate.declaration) {
          this.body.unshift(
            new ShortVariableDeclarationToken(this.predicate.identifiers, [
              new EmptyExpressionToken(chanType),
            ]),
          )
        } else {
          // !TODO: Hacky see if better way to implement this
          this.body.unshift(
            new AssignmentStatementToken(
              [new PrimaryExpressionToken(this.predicate.identifiers[0], null)],
              '=',
              [new EmptyExpressionToken(chanType)],
            ),
          )
        }
      } else compiler.instructions.push(new PopInstruction())
      new BlockToken(this.body, 'CASE BLOCK').compile(compiler)
      jump_instr.set_addr(compiler.instructions.length + 1)
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
