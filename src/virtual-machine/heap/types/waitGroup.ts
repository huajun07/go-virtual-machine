import { Heap, TAG } from '..'

import { BaseNode } from './base'
import { ContextNode } from './context'
import { QueueNode } from './queue'

/**
 * Each WaitGroupNode occupies 3 words.
 * Word 0: Wait Group tag.
 * Word 1: A non-negative number, representing how number of .Add - number of .Done calls.
 * Word 2: The address to a queue of waiting contexts.
 */
export class WaitGroupNode extends BaseNode {
  static create(heap: Heap): WaitGroupNode {
    const addr = heap.allocate(3)
    heap.set_tag(addr, TAG.WAIT_GROUP)
    heap.temp_push(addr)
    heap.memory.set_number(0, addr + 1)
    heap.memory.set_word(QueueNode.create(heap).addr, addr + 2)
    return new WaitGroupNode(heap, addr)
  }

  static default(heap: Heap): WaitGroupNode {
    return WaitGroupNode.create(heap)
  }

  count(): number {
    return this.heap.memory.get_number(this.addr + 1)
  }

  set_count(new_count: number): void {
    this.heap.memory.set_number(new_count, this.addr + 1)
  }

  queue(): QueueNode {
    return new QueueNode(this.heap, this.heap.memory.get_word(this.addr + 2))
  }

  handleAdd(): void {
    this.set_count(this.count() + 1)
  }

  handleDone(): void {
    if (this.count() === 0) {
      throw new Error('sync: negative WaitGroup counter')
    }
    this.set_count(this.count() - 1)
    if (this.count() === 0) {
      for (const contextAddr of this.queue().get_vals()) {
        const context = new ContextNode(this.heap, contextAddr)
        context.set_blocked(false)
      }
    }
  }

  handleWait(context: number): void {
    this.queue().push(context)
  }

  override get_children(): number[] {
    return [this.queue().addr]
  }

  override toString(): string {
    //! TODO: Figure out what the string format of Golang's WaitGroup is.
    throw new Error('Unimplemented')
  }
}
