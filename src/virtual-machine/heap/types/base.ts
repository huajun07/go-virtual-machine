import { Heap } from '..'

export abstract class BaseNode {
  addr = 0
  heap: Heap
  constructor(heap: Heap, addr: number) {
    this.heap = heap
    this.addr = addr
  }
  get_children(): number[] {
    return []
  }
}
