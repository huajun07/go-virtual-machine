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
}

export class BinaryInstruction extends OpInstruction {
  constructor(op: string) {
    super('BINOP', op)
  }
}
