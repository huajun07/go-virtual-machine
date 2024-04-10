import { Process } from '../../executor/process'
import { FuncNode } from '../../heap/types/func'

import { Instruction } from './base'

export class StoreInstruction extends Instruction {
  constructor() {
    super('STORE')
  }

  override execute(process: Process): void {
    const dst = process.context.popOS()
    const src = process.context.popOS()
    const dst_val = process.heap.get_value(dst)
    if (dst_val instanceof FuncNode) {
      // Note this is for debugger info to get function environment identifier
      const id = dst_val.id()
      process.heap.copy(dst, src)
      if (id) dst_val.set_id(id.addr)
    } else process.heap.copy(dst, src)

    if (process.debug_mode) {
      process.debugger.modified_buffer.add(dst)
    }
  }
}
