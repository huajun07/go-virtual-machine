import { Instruction } from './base'

export class LoadConstantInstruction extends Instruction {
  val: unknown
  constructor(val: unknown) {
    super('LDC')
    this.val = val
  }

  static is(instr: Instruction): instr is LoadConstantInstruction {
    return instr.tag === 'LDC'
  }
}
