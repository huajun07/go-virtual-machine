import { Process } from '../../executor/process'
import { FrameNode } from '../../heap/types/environment'
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

  override execute(process: Process): void {
    const new_frame = FrameNode.create(this.frame.length, process.heap)
    process.heap.temp_push(new_frame.addr)
    for (let i = 0; i < this.frame.length; i++) {
      const T = this.frame[i]
      new_frame.set_idx(T.defaultNodeCreator()(process.heap), i)
    }
    process.context.pushRTS(
      process.context.E().extend_env(new_frame.addr, this.for_block).addr,
    )
    process.heap.temp_pop()
  }
}
export class FuncBlockInstruction extends BlockInstruction {
  args: number
  constructor(args: number) {
    super(false)
    this.tag = 'FUNC_BLOCK'
    this.args = args
  }
  override execute(process: Process): void {
    super.execute(process)
    for (let i = this.args - 1; i >= 0; i--) {
      const src = process.context.popOS()
      const dst = process.context.E().get_frame().get_idx(i)
      process.heap.copy(dst, src)
    }
    // Pop function in stack
    process.context.popOS()
  }
}

export class ExitBlockInstruction extends Instruction {
  constructor() {
    super('EXIT_BLOCK')
  }

  override execute(process: Process): void {
    process.context.popRTS()
    // TODO: Implement defer in popRTS
  }
}
