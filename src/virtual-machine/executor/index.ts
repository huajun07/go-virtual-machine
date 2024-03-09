import { Instruction } from '../compiler'

import { Context } from './context'
import { execute_microcode } from './microcode'

const execute_instructions = (instrs: Instruction[]) => {
  const context = new Context()
  while (instrs[context.PC].tag !== 'DONE') {
    const instr = instrs[context.PC++]
    execute_microcode(context, instr)
    // console.log(instr.tag)
    // context.printOS()
  }
  return context.popOS()
}

export { execute_instructions }
