import { Process } from '../../executor/process'
import {
  BoolNode,
  FloatNode,
  IntegerNode,
  StringNode,
} from '../../heap/types/primitives'

import { Instruction } from './base'

export enum DataType {
  Number = 1,
  Boolean = 2,
  Float = 3,
  String = 4,
}

export class LoadConstantInstruction extends Instruction {
  val: unknown
  data_type: DataType
  constructor(val: unknown, data_type: DataType) {
    super('LDC')
    this.val = val
    this.data_type = data_type
  }

  static is(instr: Instruction): instr is LoadConstantInstruction {
    return instr.tag === 'LDC'
  }

  override execute(process: Process): void {
    if (this.data_type === DataType.Boolean) {
      process.context.pushOS(
        BoolNode.create(this.val as boolean, process.heap).addr,
      )
    } else if (this.data_type === DataType.Float) {
      process.context.pushOS(
        FloatNode.create(this.val as number, process.heap).addr,
      )
    } else if (this.data_type === DataType.Number) {
      const temp = IntegerNode.create(this.val as number, process.heap).addr
      process.context.pushOS(temp)
    } else if (this.data_type === DataType.String) {
      process.context.pushOS(
        StringNode.create(this.val as string, process.heap).addr,
      )
    }
  }
}

export class LoadVariableInstruction extends Instruction {
  frame_idx: number
  var_idx: number
  constructor(frame_idx: number, var_idx: number) {
    super('LD')
    this.frame_idx = frame_idx
    this.var_idx = var_idx
  }

  override execute(process: Process): void {
    process.context.pushOS(
      process.context.E().get_var(this.frame_idx, this.var_idx),
    )
  }
}
