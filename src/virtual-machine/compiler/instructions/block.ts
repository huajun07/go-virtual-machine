import { Instruction } from './base'

export class BlockInstruction extends Instruction {
  frame_size = 0

  constructor() {
    super('BLOCK')
  }

  set_frame_size(frame_size: number) {
    this.frame_size = frame_size
  }
}

export class ExitBlockInstruction extends Instruction {
  constructor() {
    super('EXIT_BLOCK')
  }
}
