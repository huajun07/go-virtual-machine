import { Memory } from './memory'

export class Allocator {
  size: number
  memory: Memory
  constructor(size: number, memory: Memory) {
    this.size = size
    this.memory = memory
  }
}
