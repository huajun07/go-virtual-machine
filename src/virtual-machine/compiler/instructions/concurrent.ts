import { Process } from '../../executor/process'

import { Instruction } from './base'

export class ForkInstruction extends Instruction {
  addr: number

  constructor(addr = 0) {
    super('FORK')
    this.addr = addr
  }

  set_addr(addr: number) {
    this.addr = addr
  }

  override execute(process: Process): void {
    const new_context = process.context.fork().addr
    process.heap.temp_roots.push(new_context)
    process.contexts.push(new_context)
    process.heap.temp_roots.pop()
    process.context.set_PC(this.addr)
  }
}
