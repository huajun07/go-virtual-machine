import { Context } from '../executor/context'

import { Allocator } from './allocator'
import { Memory } from './memory'

export enum TAG {
  FALSE = 0,
  TRUE = 1,
  NUMBER = 2,
}

export class Heap {
  // Assume memory is an array of 8 byte words
  memory: Memory
  size: number
  allocator: Allocator
  TRUE_ADDR = 0
  FALSE_ADDR = 0
  constructor(size: number, context: Context) {
    this.size = size
    this.memory = new Memory(size, 8)
    this.allocator = new Allocator(size, this.memory, context)
    this.allocate_literals()
  }

  allocate_literals() {
    this.TRUE_ADDR = this.allocator.allocate(1)
    this.set_tag(this.TRUE_ADDR, TAG.TRUE)
    this.set_children(this.TRUE_ADDR, [])

    this.FALSE_ADDR = this.allocator.allocate(1)
    this.set_tag(this.FALSE_ADDR, TAG.TRUE)
    this.set_children(this.FALSE_ADDR, [])

    this.allocator.set_constants([this.TRUE_ADDR, this.FALSE_ADDR])
  }

  get_value(addr: number) {
    if (this.is_number(addr)) {
      return this.get_number(addr)
    } else if (this.is_boolean(addr)) {
      return this.get_boolean(addr)
    }
    throw Error('Unknown Type')
  }

  /**
   *                [ Word Format ]
   *
   *     Free Node: [1 bit free bit] [5 bits Level data] [29 bits Prev Node] [29 bits Next Node]
   * Not-Free Node: [1 bit free bit] [5 bits Level data] [1 bit Mark & Sweep] [1 bit Children Bit]
   *                [1 Byte Type Tag] [6 Bytes Payload - Depends on type]
   *
   * Assumptions:
   *    - Address space is 2^32 bytes or 2^29 words max (Browser Memory Limit is 64 GB)
   *    - Nodes that store data in their adjacent nodes have no children
   * Notes:
   *    - We can actually store the children in ceiling(children/2) words instead
   */

  set_tag(addr: number, tag: number) {
    this.memory.set_bytes(tag, addr, 1, 1)
  }

  get_tag(addr: number) {
    return this.memory.get_bytes(addr, 1, 1)
  }

  get_children_bit(addr: number) {
    return this.memory.get_bits(addr, 1, 7)
  }

  set_children_bit(addr: number, val: number) {
    this.memory.set_bits(val, addr, 1, 7)
  }

  set_children(addr: number, children: number[]) {
    const max_size = 2 ** this.allocator.get_level(addr) + addr
    if (children.length + addr >= max_size) throw Error('Too many children!')
    if (children.length === 0) {
      this.set_children_bit(addr, 0)
      return
    }
    this.set_children_bit(addr, 1)
    for (let i = 0; i < children.length; i++) {
      this.memory.set_word(children[i], addr + i + 1)
    }
    if (children.length + addr + 1 < max_size) {
      this.memory.set_word(-1, children.length + addr + 1)
    }
  }

  get_children(addr: number) {
    const max_size = 2 ** this.allocator.get_level(addr) + addr
    if (this.get_children_bit(addr) === 0) {
      return []
    }
    const children: number[] = []
    let idx = addr + 1
    while (idx < max_size) {
      if (this.memory.get_bits(idx, 1) === 1) break
      children.push(this.memory.get_word(idx))
      idx++
    }
    return children
  }

  // -------------- [ Numbers ] -------------------
  allocate_number(num: number) {
    const addr = this.allocator.allocate(2)
    this.set_tag(addr, TAG.NUMBER)
    this.set_children(addr, [])
    this.memory.set_word(num, addr + 1)
    return addr
  }

  is_number(addr: number) {
    return this.get_tag(addr) === TAG.NUMBER
  }

  get_number(addr: number) {
    return this.memory.get_word(addr + 1) >> 0
  }

  // -------------- [ Boolean ] -------------------
  allocate_boolean(val: boolean) {
    if (val) return this.TRUE_ADDR
    else return this.FALSE_ADDR
  }

  is_boolean(addr: number) {
    return this.get_tag(addr) === TAG.TRUE || this.get_tag(addr) === TAG.FALSE
  }

  get_boolean(addr: number) {
    return this.get_tag(addr) === TAG.TRUE
  }
}
