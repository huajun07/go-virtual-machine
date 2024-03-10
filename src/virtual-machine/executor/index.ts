import { Instruction } from '../compiler'
import { Heap } from '../heap'

import { Context } from './context'
import { execute_microcode } from './microcode'

const execute_instructions = (instrs: Instruction[]) => {
  const context = new Context()
  const heap = new Heap(2048, context)
  while (instrs[context.PC].tag !== 'DONE') {
    const instr = instrs[context.PC++]
    execute_microcode(context, instr, heap)
    // console.log(instr.tag)
    // context.printOS()
  }
  return heap.get_value(context.popOS())
}

export { execute_instructions }
