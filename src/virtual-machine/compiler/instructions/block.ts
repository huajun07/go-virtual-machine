import { Type } from '../typing'

import { Instruction } from './base'

export class BlockInstruction extends Instruction {
  frame: Type[] = []
  for_block: boolean

  constructor(for_block = false) {
    super('BLOCK')
    this.for_block = for_block
  }

  set_frame(frame: Type[]) {
    this.frame = [...frame]
  }
}
export class FuncBlockInstruction extends BlockInstruction {
  args: number
  constructor(args: number) {
    super(false)
    this.tag = 'FUNC_BLOCK'
    this.args = args
  }
}

export class ExitBlockInstruction extends Instruction {
  constructor() {
    super('EXIT_BLOCK')
  }
}
