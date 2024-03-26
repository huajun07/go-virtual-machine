import { Instruction } from './base'

export class JumpInstruction extends Instruction {
  addr: number

  constructor(addr = 0) {
    super('JUMP')
    this.addr = addr
  }

  set_addr(addr: number) {
    this.addr = addr
  }
}

export class JumpIfFalseInstruction extends JumpInstruction {
  constructor(addr = 0) {
    super(addr)
    this.tag = 'JUMP_IF_FALSE'
  }
}

export class ExitLoopInstruction extends JumpInstruction {
    constructor(addr = 0) {
      super(addr)
      this.tag = 'JUMP_LOOP'
    }
  }