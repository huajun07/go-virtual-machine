import { Instruction, OpInstruction } from '../compiler'

import { Context } from './context'
import { binary_op, unary_op } from './ops'

const apply_binop = (instr: OpInstruction, x: unknown, y: unknown): unknown => {
  return binary_op[instr.op](x, y) as unknown
}

const apply_unary = (instr: OpInstruction, x: unknown): unknown => {
  return unary_op[instr.op](x) as unknown
}

const execute_microcode = (context: Context, instr: Instruction) => {
  switch (instr.tag) {
    case 'BINOP':
      {
        const arg2 = context.popOS()
        const arg1 = context.popOS()
        context.pushOS(apply_binop(instr, arg1, arg2))
      }
      break
    case 'UNOP':
      {
        const arg1 = context.popOS()
        context.pushOS(apply_unary(instr, arg1))
      }
      break
    case 'LDC':
      context.pushOS(instr.val)
      break
  }
}

export { execute_microcode }
