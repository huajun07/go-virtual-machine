export abstract class Instruction {
  tag: string

  constructor(tag: string) {
    this.tag = tag
  }
}

export class DoneInstruction extends Instruction {
  constructor() {
    super('DONE')
  }

  static is(instr: Instruction): instr is DoneInstruction {
    return instr.tag === 'DONE'
  }
}

export class PopInstruction extends Instruction {
  constructor() {
    super('POP')
  }

  static is(instr: Instruction): instr is DoneInstruction {
    return instr.tag === 'POP'
  }
}

