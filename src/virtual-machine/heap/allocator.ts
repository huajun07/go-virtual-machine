import { Memory } from './memory'

export class Allocator {
  size: number
  memory: Memory
  freelist: number[]
  max_level: number
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
    return
  }

  free(addr: number) {
    return
  }

  mark(add: number) {
    return
  }

  mark_and_sweep(addr: number) {
    return
  }

  get_prev(addr: number) {
    return this.memory.get_bits(addr * 8, 29, 6)
  }

  set_prev(addr: number, val: number) {
    return this.memory.set_bits(val, addr * 8, 29, 6)
  }

  get_next(addr: number) {
    return this.memory.get_bits(addr * 8, 29, 35)
  }

  set_next(addr: number, val: number) {
    return this.memory.set_bits(val, addr * 8, 29, 35)
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
