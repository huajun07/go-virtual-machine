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
}

export class LoadVariableInstruction extends Instruction {
  frame_idx: number
  var_idx: number
  constructor(frame_idx: number, var_idx: number) {
    super('LD')
    this.frame_idx = frame_idx
    this.var_idx = var_idx
  }
}

export class SetTypeInstruction extends Instruction {
  data_type: DataType
  frame_idx: number
  var_idx: number
  constructor(data_type: DataType, frame_idx: number, var_idx: number) {
    super('SET_TYPE')
    this.data_type = data_type
    this.frame_idx = frame_idx
    this.var_idx = var_idx
  }
}
