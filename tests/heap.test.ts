import { Heap } from '../src/virtual-machine/heap'

describe('Heap Tests', () => {
  test('Get Set Bits', () => {
    const heap = new Heap(320)
    heap.memory.set_bits(8796013022207, 121, 45, 2)
    // heap.memory.print()
    expect(heap.memory.get_bits(121, 45, 2)).toEqual(8796013022207)
  })
})
