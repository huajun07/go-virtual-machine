import { Heap } from '../heap'

// Currently temporarily cast to expected type
type BinaryOpFunc = (x: number, y: number, heap: Heap) => number
type BinaryOpType = Record<string, BinaryOpFunc>

const binary_num_to_bool_func = (func: (x: number, y: number) => boolean) => {
  return (x: number, y: number, heap: Heap) => {
    if (!heap.is_number(x) || !heap.is_number(y))
      throw Error('Error Expected Number')
    const arg1 = heap.get_number(x)
    const arg2 = heap.get_number(y)
    const res = heap.allocate_boolean(func(arg1, arg2))
    return res
  }
}

const rel_op: BinaryOpType = {
  equal: binary_num_to_bool_func((x: number, y: number) => x === y),
  not_equal: binary_num_to_bool_func((x: number, y: number) => x !== y),
  less: binary_num_to_bool_func((x: number, y: number) => x < y),
  less_or_equal: binary_num_to_bool_func((x: number, y: number) => x <= y),
  greater: binary_num_to_bool_func((x: number, y: number) => x > y),
  greater_or_equal: binary_num_to_bool_func((x: number, y: number) => x >= y),
}

const binary_num_to_num_func = (func: (x: number, y: number) => number) => {
  return (x: number, y: number, heap: Heap) => {
    if (!heap.is_number(x) || !heap.is_number(y))
      throw Error('Error Expected Number')
    const arg1 = heap.get_number(x)
    const arg2 = heap.get_number(y)
    const res = heap.allocate_number(func(arg1, arg2))
    return res
  }
}

const add_op: BinaryOpType = {
  sum: binary_num_to_num_func((x: number, y: number) => x + y),
  difference: binary_num_to_num_func((x: number, y: number) => x - y),
  bitwise_or: binary_num_to_num_func((x: number, y: number) => x | y),
  bitwise_xor: binary_num_to_num_func((x: number, y: number) => x ^ y),
}

const mul_op: BinaryOpType = {
  product: binary_num_to_num_func((x: number, y: number) => x * y),
  quotient: binary_num_to_num_func((x: number, y: number) => x / y),
  remainder: binary_num_to_num_func((x: number, y: number) => x % y),
  left_shift: binary_num_to_num_func((x: number, y: number) => x << y),
  right_shift: binary_num_to_num_func((x: number, y: number) => x >> y),
  bitwise_and: binary_num_to_num_func((x: number, y: number) => x & y),
  bit_clear: binary_num_to_num_func((x: number, y: number) => x & ~y),
}

const binary_bool_to_bool_func = (
  func: (x: boolean, y: boolean) => boolean,
) => {
  return (x: number, y: number, heap: Heap) => {
    if (!heap.is_boolean(x) || !heap.is_boolean(y))
      throw Error('Error Expected Number')
    const arg1 = heap.get_boolean(x)
    const arg2 = heap.get_boolean(y)
    const res = heap.allocate_boolean(func(arg1, arg2))
    return res
  }
}

const binary_op: BinaryOpType = {
  conditional_or: binary_bool_to_bool_func((x: boolean, y: boolean) => x || y),
  conditional_and: binary_bool_to_bool_func((x: boolean, y: boolean) => x && y),
  ...rel_op,
  ...add_op,
  ...mul_op,
}

const unary_bool_to_bool_func = (func: (x: boolean) => boolean) => {
  return (x: number, heap: Heap) => {
    if (!heap.is_boolean(x)) throw Error('Error Expected Number')
    const arg1 = heap.get_boolean(x)
    const res = heap.allocate_boolean(func(arg1))
    return res
  }
}

const unary_num_to_num_func = (func: (x: number) => number) => {
  return (x: number, heap: Heap) => {
    if (!heap.is_number(x)) throw Error('Error Expected Number')
    const arg1 = heap.get_number(x)
    const res = heap.allocate_number(func(arg1))
    return res
  }
}

type UnaryOpFunc = (x: number, heap: Heap) => number
type UnaryOpType = Record<string, UnaryOpFunc>

// NOTE: Leaving out "indirection", "address" and "receive" unary op to be implemented as an exception in executor
const unary_op: UnaryOpType = {
  plus: unary_num_to_num_func((x: number) => x),
  negation: unary_num_to_num_func((x: number) => -x),
  not: unary_bool_to_bool_func((x: boolean) => !x),
  bitwise_complement: unary_num_to_num_func((x: number) => ~x),
}

export { binary_op, unary_op }
