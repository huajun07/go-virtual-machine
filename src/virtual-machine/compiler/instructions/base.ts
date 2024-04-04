import { Process } from '../../executor/process'

export abstract class Instruction {
  tag: string

  constructor(tag: string) {
    this.tag = tag
  }

  abstract execute(process: Process): void
}

export class DoneInstruction extends Instruction {
  constructor() {
    super('DONE')
  }

  static is(instr: Instruction): instr is DoneInstruction {
    return instr.tag === 'DONE'
  }

  override execute(_process: Process): void {
    // Do nothing.
  }
}

export class PopInstruction extends Instruction {
  constructor() {
    super('POP')
  }

  static is(instr: Instruction): instr is DoneInstruction {
    return instr.tag === 'POP'
  }

  override execute(process: Process): void {
    process.context.popOS()
  }
}
