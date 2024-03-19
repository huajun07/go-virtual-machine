import { Context } from '../executor/context'

import { Allocator } from './allocator'
import { Memory } from './memory'

export enum TAG {
  UNKNOWN = 0,
  BOOLEAN = 1,
  NUMBER = 2,
  FRAME_PTR = 3,
  FRAME = 4,
  ENVIRONMENT = 5,
  FLOAT = 6,
  STRING = 7,
}

export class Heap {
  // Assume memory is an array of 8 byte words
  memory: Memory
  size: number
  allocator: Allocator
  UNASSIGNED = 0
  constructor(size: number, context: Context) {
    this.size = size
    this.memory = new Memory(size, 8)
    this.allocator = new Allocator(size, this.memory, context)
    this.allocate_literals()
  }

  allocate_literals() {
    this.UNASSIGNED = this.allocator.allocate(1)
    this.set_tag(this.UNASSIGNED, TAG.UNKNOWN)
    this.allocator.set_children(this.UNASSIGNED, [])

    this.allocator.set_constants([this.UNASSIGNED])
  }

  get_value(addr: number) {
    if (this.is_number(addr)) {
      return this.get_number(addr)
    } else if (this.is_boolean(addr)) {
      return this.get_boolean(addr)
    } else if (this.is_float(addr)) {
      return this.get_float(addr)
    } else if (this.is_string(addr)) {
      return this.get_string(addr)
    }
    throw Error('Unknown Type')
  }

  copy(dst: number, src: number) {
    const sz = 2 ** this.allocator.get_level(src)
    for (let i = 0; i < sz; i++) {
      this.memory.set_word(this.memory.get_word(src + i), dst + i)
    }
  }

  clone(addr: number) {
    const sz = 2 ** this.allocator.get_level(addr)
    const res = this.allocator.allocate(sz)
    // console.log("clone", res)
    this.copy(res, addr)
    return res
  }

  store_value(dst: number, src: number) {
    const prev_dst = dst
    dst = this.frame_ptr(dst)
    src = this.frame_ptr(src)
    if (this.get_tag(dst) === TAG.UNKNOWN) {
      this.set_addr(this.clone(src), prev_dst)
      return
    }
    if (this.get_tag(dst) !== this.get_tag(src))
      throw Error('Invalid Type Assignment')
    // TODO: Array length check
    this.copy(dst, src)
  }

  frame_ptr(addr: number) {
    if (this.get_tag(addr) === TAG.FRAME_PTR)
      return this.memory.get_bytes(addr, 4, 4)
    return addr
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

  get_addr(addr: number) {
    return this.memory.get_bytes(addr, 4, 4)
  }

  set_addr(val: number, addr: number) {
    return this.memory.set_bytes(val, addr, 4, 4)
  }

  get_child(addr: number, index: number) {
    return this.get_addr(addr + index + 1)
  }

  // -------------- [ Numbers ] -------------------
  allocate_number(num: number) {
    const addr = this.allocator.allocate(2)
    this.set_tag(addr, TAG.NUMBER)
    this.allocator.set_children(addr, [])
    this.memory.set_number(BigInt(num), addr + 1)
    // console.log("Number: ", num, addr)
    return addr
  }

  is_number(addr: number) {
    addr = this.frame_ptr(addr)
    return this.get_tag(addr) === TAG.NUMBER
  }

  get_number(addr: number) {
    addr = this.frame_ptr(addr)
    return Number(this.memory.get_number(addr + 1))
  }

  // -------------- [ Floats ] -------------------
  allocate_float(num: number) {
    const addr = this.allocator.allocate(2)
    this.set_tag(addr, TAG.FLOAT)
    this.allocator.set_children(addr, [])
    this.memory.set_float(num, addr + 1)
    // console.log("Float: ", num, addr)
    return addr
  }

  is_float(addr: number) {
    addr = this.frame_ptr(addr)
    return this.get_tag(addr) === TAG.FLOAT
  }

  get_float(addr: number) {
    addr = this.frame_ptr(addr)
    return this.memory.get_float(addr + 1)
  }

  // -------------- [ String ] -------------------
  // [6 Bytes Payload]: String Length
  allocate_string(str: string) {
    const sz = Math.ceil(str.length / 8)
    const addr = this.allocator.allocate(sz + 1)
    this.set_tag(addr, TAG.STRING)
    this.allocator.set_children(addr, [])
    this.memory.set_bytes(str.length, addr, 6, 2)
    for (let i = 0; i < str.length; i++) {
      this.memory.set_bytes(
        str.charCodeAt(i),
        Math.floor(i / 8) + addr + 1,
        1,
        i % 8,
      )
    }
    // console.log("String: ", str, addr)
    return addr
  }

  is_string(addr: number) {
    addr = this.frame_ptr(addr)
    return this.get_tag(addr) === TAG.STRING
  }

  get_string(addr: number) {
    addr = this.frame_ptr(addr)
    const len = this.memory.get_bytes(addr, 6, 2)
    let res = ''
    for (let i = 0; i < len; i++) {
      res += String.fromCharCode(
        this.memory.get_bytes(Math.floor(i / 8) + addr + 1, 1, i % 8),
      )
    }
    return res
  }

  // -------------- [ Boolean ] -------------------
  // [6 byte payload: first byte determines false or true]
  allocate_boolean(val: boolean) {
    const addr = this.allocator.allocate(1)
    this.set_tag(addr, TAG.BOOLEAN)
    this.allocator.set_children(addr, [])
    this.memory.set_bytes(val ? -1 : 0, addr, 1, 2)
    return addr
  }

  is_boolean(addr: number) {
    addr = this.frame_ptr(addr)
    return this.get_tag(addr) === TAG.BOOLEAN
  }

  get_boolean(addr: number) {
    addr = this.frame_ptr(addr)
    return this.memory.get_bytes(addr, 1, 2) !== 0
  }

  // -------------- [ Environment ] -------------------
  allocate_env(frames: number[]) {
    const addr = this.allocator.allocate(frames.length + 1)
    this.set_tag(addr, TAG.ENVIRONMENT)
    this.allocator.set_children(addr, frames)
    // console.log("Env: ", addr)
    return addr
  }

  extend_env(addr: number, frame: number) {
    const frames = this.allocator.get_children(addr)
    frames.push(frame)
    const env = this.allocate_env(frames)
    return env
  }

  get_var(addr: number, frame_idx: number, var_idx: number) {
    const frame = this.get_child(addr, frame_idx)
    return frame + var_idx + 1
  }

  // -------------- [ Frame ] -------------------
  allocate_frame(frame_size: number) {
    const addr = this.allocator.allocate(frame_size + 1)
    this.set_tag(addr, TAG.FRAME)
    this.allocator.set_children(addr, Array(frame_size).fill(this.UNASSIGNED))
    for (let i = 0; i < frame_size; i++) {
      this.set_tag(addr + i + 1, TAG.FRAME_PTR)
    }
    // console.log("Frame: ", frame_size, addr)
    return addr
  }
}
