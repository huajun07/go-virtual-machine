import { Process } from '../../executor/process'
import { FrameNode } from '../../heap/types/environment'
import { FuncNode } from '../../heap/types/func'
import { Type } from '../typing'

import { Instruction } from './base'

export class BlockInstruction extends Instruction {
  frame: Type[] = []
  identifiers: string[] = []
  constructor(public name: string, public for_block = false) {
    super('BLOCK')
  }

  set_frame(frame: Type[]) {
    this.frame = [...frame]
  }

  set_identifiers(identifiers: string[]) {
    this.identifiers = [...identifiers]
  }

  override execute(process: Process): void {
    const new_frame = FrameNode.create(this.frame.length, process.heap)
    process.heap.temp_push(new_frame.addr)
    for (let i = 0; i < this.frame.length; i++) {
      const T = this.frame[i]
      new_frame.set_idx(T.defaultNodeCreator()(process.heap), i)
    }
    const new_env = process.context
      .E()
      .extend_env(new_frame.addr, this.for_block).addr
    process.context.pushRTS(new_env)
    process.heap.temp_pop()

    process.debugger.env_alloc_map.set(new_env, process.runtime_count)
    process.debugger.env_name_map.set(new_env, this.name)
    process.debugger.identifier_map.set(new_env, this.identifiers)
  }
}
export class FuncBlockInstruction extends BlockInstruction {
  constructor(public args: number) {
    super('ANONY FUNC', false)
    this.tag = 'FUNC_BLOCK'
  }
  override execute(process: Process): void {
    super.execute(process)
    for (let i = this.args - 1; i >= 0; i--) {
      const src = process.context.popOS()
      const dst = process.context.E().get_frame().get_idx(i)
      process.heap.copy(dst, src)
    }
    // Pop function in stack
    const id = new FuncNode(process.heap, process.context.popOS()).id()
    if (id) {
      const identifiers = process.debugger.identifier_map.get(id.E())
      if (identifiers)
        process.debugger.env_name_map.set(
          process.context.E().addr,
          identifiers[id.idx()],
        )
    }
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
