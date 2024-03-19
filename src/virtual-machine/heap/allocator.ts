import { Context } from '../executor/context'

import { Memory } from './memory'

export class Allocator {
  size: number
  memory: Memory
  freelist: number[]
  max_level: number
  context: Context
  constants: number[] = []
  constructor(size: number, memory: Memory, context: Context) {
    this.context = context
    this.size = size
    this.memory = memory
    this.max_level = this.calc_level(size)
    this.freelist = []
    for (let i = 0; i < this.max_level; i++) this.freelist.push(-1)
    let cur_addr = 0
    while (cur_addr < size) {
      this.set_free(cur_addr, true)
      const lvl = this.calc_level(size - cur_addr)
      this.add_list(cur_addr, lvl)
      cur_addr += 2 ** lvl
    }
  }

  set_constants(constants: number[]) {
    this.constants = constants
  }

  // [********** Linked List Helper Funcs ****************]

  /**
   * Doubly Linked List Implementation for LogN Freelists
   * A Node is the first node if prev_node = cur_addr
   * Similarly a node is the last node if next_node = cur_addr
   */

  add_list(addr: number, lvl: number) {
    this.set_level(addr, lvl)
    this.set_prev(addr, addr)
    if (this.freelist[lvl] === -1) {
      this.set_next(addr, addr)
    } else this.set_next(addr, this.freelist[lvl])
    this.freelist[lvl] = addr
  }

  pop_list(addr: number) {
    const lvl = this.get_level(addr)
    const prev_addr = this.get_prev(addr)
    const next_addr = this.get_next(addr)
    if (prev_addr === addr) {
      // Is head
      this.freelist[lvl] = next_addr === addr ? -1 : next_addr
    } else {
      this.set_next(prev_addr, next_addr === addr ? prev_addr : next_addr)
    }
    if (next_addr !== addr) {
      this.set_prev(next_addr, prev_addr === addr ? next_addr : prev_addr)
    }
    this.memory.set_word(0, addr)
  }

  // [********** Buddy Block Allocation + Free-ing ****************]

  allocate(size: number) {
    const try_allocate = () => {
      const lvl = Math.ceil(Math.log2(size))
      for (let cur_lvl = lvl; cur_lvl < this.freelist.length; cur_lvl++) {
        if (this.freelist[cur_lvl] !== -1) {
          const addr = this.freelist[cur_lvl]
          this.pop_list(addr)
          this.set_free(addr, false)
          while (cur_lvl > lvl) {
            cur_lvl--
            const sibling = addr + 2 ** cur_lvl
            this.set_free(sibling, true)
            this.add_list(sibling, cur_lvl)
          }
          this.set_level(addr, lvl)
          return addr
        }
      }
      return -1
    }

    let addr = try_allocate()
    if (addr === -1) {
      this.mark_and_sweep()
      addr = try_allocate()
    }
    if (addr === -1) throw Error('Ran out of memory!')
    return addr
  }

  free(addr: number) {
    let lvl = this.get_level(addr)
    while (lvl < this.freelist.length) {
      const sibling = addr ^ (1 << lvl)
      if (sibling >= this.size || !this.is_free(sibling)) break
      this.pop_list(sibling)
      addr = Math.min(addr, sibling)
      lvl++
    }
    this.set_free(addr, true)
    this.add_list(addr, lvl)
    return addr + (1 << lvl)
  }

  // [********** Garbage Collection: Mark and Sweep ****************]

  is_marked(addr: number) {
    return this.memory.get_bits(addr, 1, 6) === 1
  }

  set_mark(addr: number, mark: boolean) {
    this.memory.set_bits(mark ? 1 : 0, addr, 1, 6)
  }

  get_children_bit(addr: number) {
    return this.memory.get_bits(addr, 1, 7)
  }

  set_children_bit(addr: number, val: number) {
    this.memory.set_bits(val, addr, 1, 7)
  }

  set_children(addr: number, children: number[]) {
    const max_size = 2 ** this.get_level(addr) + addr
    if (children.length + addr >= max_size) throw Error('Too many children!')
    if (children.length === 0) {
      this.set_children_bit(addr, 0)
      return
    }
    this.set_children_bit(addr, 1)
    for (let i = 0; i < children.length; i++) {
      this.memory.set_bytes(children[i], addr + i + 1, 4, 4)
    }
    if (children.length + addr + 1 < max_size) {
      this.memory.set_word(-1, children.length + addr + 1)
    }
  }

  get_children(addr: number) {
    const max_size = 2 ** this.get_level(addr) + addr
    if (this.get_children_bit(addr) === 0) {
      return []
    }
    const children: number[] = []
    let idx = addr + 1
    while (idx < max_size) {
      if (this.memory.get_bits(idx, 1) === 1) break
      children.push(this.memory.get_bytes(idx, 4, 4))
      idx++
    }
    return children
  }
  mark(addr: number) {
    if (this.is_marked(addr)) return
    this.set_mark(addr, true)
    const children = this.get_children(addr)
    for (const child of children) {
      this.mark(child)
    }
  }

  mark_and_sweep() {
    const roots = [...this.context.getRoots(), ...this.constants]
    for (const root of roots) {
      this.mark(root)
    }
    for (let cur_addr = 0; cur_addr < this.size; ) {
      if (!this.is_free(cur_addr) && !this.is_marked(cur_addr)) {
        cur_addr = this.free(cur_addr)
      } else {
        if (this.is_marked(cur_addr)) this.set_mark(cur_addr, false)
        cur_addr += 2 ** this.get_level(cur_addr)
      }
    }
    return
  }

  get_prev(addr: number) {
    return this.memory.get_bits(addr, 29, 6)
  }

  set_prev(addr: number, val: number) {
    this.memory.set_bits(val, addr, 29, 6)
  }

  get_next(addr: number) {
    return this.memory.get_bits(addr, 29, 35)
  }

  set_next(addr: number, val: number) {
    this.memory.set_bits(val, addr, 29, 35)
  }

  set_level(addr: number, lvl: number) {
    this.memory.set_bits(lvl, addr, 5, 1)
  }

  get_level(addr: number) {
    return this.memory.get_bits(addr, 5, 1)
  }

  is_free(addr: number) {
    return this.memory.get_bits(addr, 1) === 1
  }

  set_free(addr: number, free: boolean) {
    this.memory.set_bits(free ? 1 : 0, addr, 1)
  }

  calc_level(x: number) {
    return Math.floor(Math.log2(x))
  }
}
