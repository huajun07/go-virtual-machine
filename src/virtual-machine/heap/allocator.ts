import { Context } from '../executor/context'

import { Memory } from './memory'

export class Allocator {
  size: number
  memory: Memory
  freelist: number[]
  max_level: number
  context: Context
  constructor(size: number, memory: Memory) {
    size = Math.floor(size / 8)
    this.size = size
    this.memory = memory
    this.max_level = this.calc_level(size / 8)
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
  }

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

  is_marked(addr: number) {
    return this.memory.get_bits(addr * 8, 1, 6) === 1
  }
  set_mark(addr: number, mark: boolean) {
    this.memory.set_bits(mark ? 1 : 0, addr * 8, 1, 6)
  }

  get_num_children(addr: number) {
    return this.memory.get_bytes(addr * 8 + 2, 2)
  }

  get_child(addr: number, index: number) {
    return this.memory.get_word((addr + index + 1) * 8)
  }

  mark(addr: number) {
    if (this.is_marked(addr)) return
    this.set_mark(addr, true)
    const children = this.get_num_children(addr)
    for (let i = 0; i < children; i++) {
      this.mark(this.get_child(addr, i))
    }
  }

  mark_and_sweep() {
    const roots = this.context.getRoots()
    for (const root of roots) {
      this.mark(root)
    }
    for (let cur_addr = 0; cur_addr < this.size; ) {
      if (!this.is_free(cur_addr) && this.is_marked(cur_addr)) {
        cur_addr = this.free(cur_addr)
      } else cur_addr += 2 ** this.get_level(cur_addr)
    }
    return
  }

  get_prev(addr: number) {
    return this.memory.get_bits(addr * 8, 29, 6)
  }

  set_prev(addr: number, val: number) {
    this.memory.set_bits(val, addr * 8, 29, 6)
  }

  get_next(addr: number) {
    return this.memory.get_bits(addr * 8, 29, 35)
  }

  set_next(addr: number, val: number) {
    this.memory.set_bits(val, addr * 8, 29, 35)
  }

  set_level(addr: number, lvl: number) {
    return this.memory.set_bits(lvl, addr * 8, 5, 1)
  }

  get_level(addr: number) {
    return this.memory.get_bits(addr * 8, 5, 1)
  }

  is_free(addr: number) {
    return this.memory.get_bits(addr * 8, 1) === 1
  }

  set_free(addr: number, free: boolean) {
    this.memory.get_bits(free ? 1 : 0, addr * 8, 1)
  }

  calc_level(x: number) {
    return Math.floor(Math.log2(x))
  }
}
