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
    this.set_num_children(this.TRUE_ADDR, 0)

    this.FALSE_ADDR = this.allocator.allocate(1)
    this.set_tag(this.FALSE_ADDR, TAG.TRUE)
    this.set_num_children(this.FALSE_ADDR, 0)

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
   * Not-Free Node: [1 bit free bit] [5 bits Level data] [1 bit Mark & Sweep] [1 bit Unused]
   *                [1 Byte Type Tag] [2 Bytes # of Children] [4 Bytes Payload - Depends on typ]
   */

  set_tag(addr: number, tag: number) {
    this.memory.set_bytes(tag, addr, 1, 1)
  }

  get_tag(addr: number) {
    return this.memory.get_bytes(addr, 1, 1)
  }

  set_num_children(addr: number, num: number) {
    this.memory.set_bytes(num, addr, 2, 2)
  }

  get_num_children(addr: number) {
    return this.memory.get_bytes(addr, 2, 2)
  }

  set_child(addr: number, index: number, val: number) {
    this.memory.set_word(val, addr + (index + 1))
  }

  get_child(addr: number, index: number) {
    return this.memory.get_word(addr + (index + 1))
  }

  // -------------- [ Numbers ] -------------------
  allocate_number(num: number) {
    const addr = this.allocator.allocate(2)
    this.set_tag(addr, TAG.NUMBER)
    this.set_num_children(addr, 0)
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
