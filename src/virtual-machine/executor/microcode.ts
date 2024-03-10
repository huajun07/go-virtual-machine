import { Instruction, OpInstruction } from '../compiler'
import { Heap } from '../heap'

import { Context } from './context'
import { binary_op, unary_op } from './ops'

const apply_binop = (
  instr: OpInstruction,
  x: number,
  y: number,
  heap: Heap,
): number => {
  return binary_op[instr.op](x, y, heap)
}

const apply_unary = (instr: OpInstruction, x: number, heap: Heap): number => {
  return unary_op[instr.op](x, heap)
}

const execute_microcode = (
  context: Context,
  instr: Instruction,
  heap: Heap,
) => {
  switch (instr.tag) {
    case 'BINOP':
      {
        const arg2 = context.popOS()
        const arg1 = context.popOS()
        context.pushOS(apply_binop(instr, arg1, arg2, heap))
      }
      break
    case 'UNOP':
      {
        const arg1 = context.popOS()
        context.pushOS(apply_unary(instr, arg1, heap))
      }
      break
    case 'LDC':
      // Check what type from the token
      context.pushOS(heap.allocate_number(instr.val as number))
      break
  }
}

export { execute_microcode }
