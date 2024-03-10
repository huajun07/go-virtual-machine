import {
  BinaryInstruction,
  Instruction,
  LoadConstantInstruction,
  OpInstruction,
  UnaryInstruction,
} from '../compiler/instructions'
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
  if (BinaryInstruction.is(instr)) {
    const arg2 = context.popOS()
    const arg1 = context.popOS()
    context.pushOS(apply_binop(instr, arg1, arg2, heap))
  } else if (UnaryInstruction.is(instr)) {
    const arg1 = context.popOS()
    context.pushOS(apply_unary(instr, arg1, heap))
  } else if (LoadConstantInstruction.is(instr)) {
    // Check what type from the token
    context.pushOS(heap.allocate_number(instr.val as number))
  } else {
    throw Error('Invalid Instruction')
  }
}

export { execute_microcode }
