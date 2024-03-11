import { runCode } from '../src/virtual-machine'
import { Context } from '../src/virtual-machine/executor/context'
import { Heap } from '../src/virtual-machine/heap'

describe('Heap Tests', () => {
  test('Get Set Bits', () => {
    const heap = new Heap(320, new Context())
    heap.memory.set_bits(8796013022207, 121, 45, 2)
    // heap.memory.print()
    expect(heap.memory.get_bits(121, 45, 2)).toEqual(8796013022207)
  })
  test('Get Set Bits 2', () => {
    const heap = new Heap(320, new Context())
    heap.memory.set_bits(-1, 121, 45, 2)
    // heap.memory.print()
    expect(heap.memory.get_bits(121, 45, 2)).toEqual(35184372088831) // 2**45 - 1
  })
  test('Get Set Bits 3', () => {
    const heap = new Heap(10, new Context())
    heap.memory.set_bits(1, 1, 29, 6)
    heap.memory.set_bits(2, 1, 29, 35)
    expect(heap.memory.get_bits(1, 29, 6)).toEqual(1)
  })
  test('Get Set Bits 4', () => {
    const heap = new Heap(10, new Context())
    heap.memory.set_bits(2, 3, 5, 1)
    heap.memory.set_bits(3, 3, 29, 6)
    expect(heap.memory.get_bits(3, 5, 1)).toEqual(2)
  })
  test('Mark And Sweep', () => {
    expect(runCode('(2+1 < 3) || (7 == 9%5 + 15/5)', 16).output).toEqual('true')
  })
})
