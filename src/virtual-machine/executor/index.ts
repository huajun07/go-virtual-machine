import { Instruction } from 'virtual-machine/compiler'

import { Context } from './context'
import { execute_microcode } from './microcode'

const executor_instructions = (instrs: Instruction[]) => {
  const context = new Context()
  while (instrs[context.PC].tag !== 'DONE') {
    const instr = instrs[context.PC++]
    // console.log(instr.tag)
    // context.printOS()
    execute_microcode(context, instr)
  }
  return context.popOS()
}

export { executor_instructions }
