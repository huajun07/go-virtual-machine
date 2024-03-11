import { Instruction } from '../compiler'
import { Heap } from '../heap'

import { Context } from './context'
import { execute_microcode } from './microcode'

const execute_instructions = (instrs: Instruction[], heapsize: number) => {
  const context = new Context()
  const heap = new Heap(heapsize, context)
  while (instrs[context.PC].tag !== 'DONE') {
    const instr = instrs[context.PC++]
    execute_microcode(context, instr, heap)
    // console.log(instr)
    // context.printOS()
  }
  return heap.get_value(context.popOS())
}

export { execute_instructions }
