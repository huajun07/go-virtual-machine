import { Heap, TAG } from '..'

import { BaseNode } from './base'
import { EnvironmentNode } from './environment'
import { PrimitiveNode } from './primitives'
import { StackNode } from './structures'

export class ContextNode extends BaseNode {
  // [metadata] [PC] [OS] [E] [RTS]
  static create(heap: Heap) {
    const addr = heap.allocate(5)
    heap.set_tag(addr, TAG.CONTEXT)
    heap.memory.set_number(0, addr + 1)
    heap.temp_roots.push(addr)
    heap.memory.set_word(StackNode.create(heap).addr, addr + 2)
    heap.memory.set_number(-1, addr + 3)
    heap.memory.set_word(StackNode.create(heap).addr, addr + 4)
    heap.temp_roots.pop()
    return new ContextNode(heap, addr)
  }

  set_PC(PC: number) {
    this.heap.memory.set_number(PC, this.addr + 1)
  }

  PC() {
    return this.heap.memory.get_number(this.addr + 1)
  }

  OS() {
    return new StackNode(this.heap, this.heap.memory.get_word(this.addr + 2))
  }

  E() {
    return new EnvironmentNode(
      this.heap,
      this.heap.memory.get_word(this.addr + 3),
    )
  }

  set_E(addr: number) {
    this.heap.memory.set_word(addr, this.addr + 3)
  }

  RTS() {
    return new StackNode(this.heap, this.heap.memory.get_word(this.addr + 4))
  }

  incr_PC() {
    const pc = this.PC()
    this.set_PC(pc + 1)
    return pc
  }

  pushOS(addr: number) {
    this.OS().push(addr)
  }

  peekOS() {
    return this.OS().peek()
  }

  /**
   * @param val 0-indexed from the back
   * @returns
   */
  peekOSIdx(val: number) {
    const sz = this.OS().sz()
    return this.OS().get_idx(sz - val - 1)
  }

  popOS() {
    return this.OS().pop()
  }

  printOS() {
    console.log('OS:')
    for (let i = 0; i < this.OS().sz(); i++) {
      const val = this.heap.get_value(this.OS().get_idx(i)) as PrimitiveNode
      console.log(val)
      // console.log(val.get_value())
    }
  }

  pushRTS(addr: number) {
    this.RTS().push(this.heap.memory.get_word(this.addr + 3))
    this.heap.memory.set_word(addr, this.addr + 3)
  }

  popRTS() {
    const old_E = this.RTS().pop()
    if (!old_E) throw Error('RTS Stack Empty')
    this.heap.memory.set_word(old_E, this.addr + 3)
    return old_E
  }

  printRTS() {
    console.log('RTS:')
    for (let i = 0; i < this.RTS().sz(); i++) {
      const addr = this.RTS().get_idx(i)
      const val = addr === -1 ? -1 : this.heap.get_value(addr)
      //   console.log(val)
      console.log(val)
    }
  }

  override get_children(): number[] {
    const children = [this.RTS().addr, this.OS().addr]
    const E_addr = this.heap.memory.get_word(this.addr + 3)
    if (E_addr !== -1) children.push(E_addr)
    return children
  }
}
