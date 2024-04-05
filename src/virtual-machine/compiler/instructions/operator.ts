import { Process } from '../../executor/process'
import { PrimitiveNode } from '../../heap/types/primitives'

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

  override execute(process: Process): void {
    const arg1 = process.heap.get_value(
      process.context.popOS(),
    ) as PrimitiveNode
    process.context.pushOS(arg1.apply_unary(this.op).addr)
  }
}

export class BinaryInstruction extends OpInstruction {
  constructor(op: string) {
    super('BINOP', op)
  }

  override execute(process: Process): void {
    const arg2 = process.heap.get_value(
      process.context.popOS(),
    ) as PrimitiveNode
    const arg1 = process.heap.get_value(
      process.context.popOS(),
    ) as PrimitiveNode
    process.context.pushOS(arg1.apply_binop(arg2, this.op).addr)
  }
}
