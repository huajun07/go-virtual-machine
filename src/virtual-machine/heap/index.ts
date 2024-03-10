import { Allocator } from './allocator'
import { Memory } from './memory'

export class Heap {
  // Assume memory is an array of 8 byte words
  memory: Memory
  size: number
  allocator: Allocator
  constructor(size: number) {
    
    this.size = size
    this.memory = new Memory(size, 8)
    this.allocator = new Allocator(size, this.memory)
  }
}
