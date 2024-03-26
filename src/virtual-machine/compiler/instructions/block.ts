import { Instruction } from './base'

export class BlockInstruction extends Instruction {
  frame_size = 0
  for_block: boolean

  constructor(for_block = false) {
    super('BLOCK')
    this.for_block = for_block
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
