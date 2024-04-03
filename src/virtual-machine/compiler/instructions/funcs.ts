import { Instruction } from './base'

export class LoadFuncInstruction extends Instruction {
  PC: number
  constructor(PC: number) {
    super('LF')
    this.PC = PC
  }

  static is(instr: Instruction): instr is LoadFuncInstruction {
    return instr.tag === 'LF'
  }
}

export class CallInstruction extends Instruction {
  args: number
  constructor(args: number) {
    super('CALL')
    this.args = args
  }

  static is(instr: Instruction): instr is CallInstruction {
    return instr.tag === 'CALL'
  }
}

export class ReturnInstruction extends Instruction {
  constructor() {
    super('RET')
  }

  static is(instr: Instruction): instr is ReturnInstruction {
    return instr.tag === 'RET'
  }
}
