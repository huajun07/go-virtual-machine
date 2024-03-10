import { Instruction } from './base'

export abstract class OpInstruction extends Instruction {
  op: string

  constructor(tag: string, op: string) {
    super(tag)
    this.op = op
  }
}

export class UnaryInstruction extends OpInstruction {
  constructor(op: string) {
    super('UNARY', op)
  }

  static is(instr: Instruction): instr is UnaryInstruction {
    return instr.tag === 'UNARY'
  }
}

export class BinaryInstruction extends OpInstruction {
  constructor(op: string) {
    super('BINOP', op)
  }

  static is(instr: Instruction): instr is BinaryInstruction {
    return instr.tag === 'BINOP'
  }
}
