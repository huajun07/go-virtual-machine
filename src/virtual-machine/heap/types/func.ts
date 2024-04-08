import { Heap, TAG } from '..'

import { BaseNode } from './base'
import { StringNode } from './primitives'

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

/**
 * Represents a hardcoded method.
 * Word 0 - MethodNode tag.
 * Word 1 - Receiver address.
 * Word 2 - String literal address, representing the method name.
 * */
export class MethodNode extends BaseNode {
  static create(receiver: number, identifier: string, heap: Heap): MethodNode {
    const addr = heap.allocate(3)
    heap.set_tag(addr, TAG.METHOD)
    heap.memory.set_word(receiver, addr + 1)
    heap.memory.set_word(StringNode.create(identifier, heap).addr, addr + 2)
    heap.temp_push(addr)
    heap.temp_pop()
    return new MethodNode(heap, addr)
  }

  receiverAddr(): number {
    return this.heap.memory.get_word(this.addr + 1)
  }

  receiver() {
    return this.heap.get_value(this.receiverAddr())
  }

  identifierAddr(): number {
    return this.heap.memory.get_word(this.addr + 2)
  }

  identifier(): string {
    return new StringNode(this.heap, this.identifierAddr()).get_value()
  }

  override get_children(): number[] {
    return [this.receiverAddr(), this.identifierAddr()]
  }
}
