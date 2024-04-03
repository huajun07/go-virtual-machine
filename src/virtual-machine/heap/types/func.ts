import { Heap, TAG } from '..'

import { BaseNode } from './base'

export class FuncNode extends BaseNode {
  static create(PC: number, env: number, heap: Heap) {
    const addr = heap.allocate(3)

    heap.set_tag(addr, TAG.FUNC)
    heap.memory.set_word(PC, addr + 1)
    heap.memory.set_word(env, addr + 2)
    return new FuncNode(heap, addr)
  }

  static default(heap: Heap) {
    return FuncNode.create(-1, -1, heap)
  }

  PC() {
    return this.heap.memory.get_word(this.addr + 1)
  }

  E() {
    return this.heap.memory.get_word(this.addr + 2)
  }

  override get_children(): number[] {
    return [this.E()]
  }
}

export class CallRefNode extends BaseNode {
  static create(PC: number, heap: Heap) {
    const addr = heap.allocate(2)

    heap.set_tag(addr, TAG.CALLREF)
    heap.memory.set_word(PC, addr + 1)
    return new CallRefNode(heap, addr)
  }
  PC() {
    return this.heap.memory.get_word(this.addr + 1)
  }
}
