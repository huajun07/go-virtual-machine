import { Heap } from '../heap'

// Currently temporarily cast to expected type
type BinaryOpFunc = (x: number, y: number, heap: Heap) => number
type BinaryOpType = Record<string, BinaryOpFunc>

const binary_type_to_bool_func = (
  func: (x: number | string, y: number | string) => boolean,
) => {
  return (x: number, y: number, heap: Heap) => {
    let arg1: number | string = 0
    let arg2: number | string = 0
    if (heap.is_number(x) && heap.is_number(y)) {
      arg1 = heap.get_number(x)
      arg2 = heap.get_number(y)
    } else if (heap.is_float(x) && heap.is_float(y)) {
      arg1 = heap.get_float(x)
      arg2 = heap.get_float(y)
    } else if (heap.is_string(x) && heap.is_string(y)) {
      arg1 = heap.get_string(x)
      arg2 = heap.get_string(y)
    } else throw Error('Error Invalid Operand Types')
    const res = heap.allocate_boolean(func(arg1, arg2))
    return res
  }
}

const rel_op: BinaryOpType = {
  equal: binary_type_to_bool_func(
    (x: number | string, y: number | string) => x === y,
  ),
  not_equal: binary_type_to_bool_func(
    (x: number | string, y: number | string) => x !== y,
  ),
  less: binary_type_to_bool_func(
    (x: number | string, y: number | string) => x < y,
  ),
  less_or_equal: binary_type_to_bool_func(
    (x: number | string, y: number | string) => x <= y,
  ),
  greater: binary_type_to_bool_func(
    (x: number | string, y: number | string) => x > y,
  ),
  greater_or_equal: binary_type_to_bool_func(
    (x: number | string, y: number | string) => x >= y,
  ),
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

const binary_float_to_num_func = (func: (x: number, y: number) => number) => {
  return (x: number, y: number, heap: Heap) => {
    if (heap.is_number(x) && heap.is_number(y)) {
      const arg1 = heap.get_number(x)
      const arg2 = heap.get_number(y)
      const res = heap.allocate_number(func(arg1, arg2))
      return res
    } else if (heap.is_float(x) && heap.is_float(y)) {
      const arg1 = heap.get_float(x)
      const arg2 = heap.get_float(y)
      const res = heap.allocate_float(func(arg1, arg2))
      return res
    } else throw Error('Error Invalid Operand Types')
  }
}

const binary_type_to_type_func = (
  func: <Type extends string | number>(x: Type, y: Type) => Type,
) => {
  return (x: number, y: number, heap: Heap) => {
    if (heap.is_number(x) && heap.is_number(y)) {
      const arg1 = heap.get_number(x)
      const arg2 = heap.get_number(y)
      const res = heap.allocate_number(func(arg1, arg2))
      return res
    } else if (heap.is_float(x) && heap.is_float(y)) {
      const arg1 = heap.get_float(x)
      const arg2 = heap.get_float(y)
      const res = heap.allocate_float(func(arg1, arg2))
      return res
    } else if (heap.is_string(x) && heap.is_string(y)) {
      const arg1 = heap.get_string(x)
      const arg2 = heap.get_string(y)
      const res = heap.allocate_string(func(arg1, arg2))
      return res
    } else throw Error('Error Invalid Operand Types')
  }
}
const add_op: BinaryOpType = {
  sum: binary_type_to_type_func(
    <Type extends string | number>(x: Type, y: Type) => {
      if (typeof x === 'number' && typeof y === 'number') {
        return (x + y) as Type
      } else if (typeof x === 'string' && typeof y === 'string') {
        return (x + y) as Type
      } else {
        // Handle other cases or throw an error
        throw new Error('Unsupported types for addition')
      }
    },
  ),
  difference: binary_float_to_num_func((x: number, y: number) => x - y),
  bitwise_or: binary_num_to_num_func((x: number, y: number) => x | y),
  bitwise_xor: binary_num_to_num_func((x: number, y: number) => x ^ y),
}

const mul_op: BinaryOpType = {
  product: binary_float_to_num_func((x: number, y: number) => x * y),
  quotient: binary_float_to_num_func((x: number, y: number) => x / y),
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

const unary_float_to_num_func = (func: (x: number) => number) => {
  return (x: number, heap: Heap) => {
    if (heap.is_number(x)) {
      const arg1 = heap.get_number(x)
      const res = heap.allocate_number(func(arg1))
      return res
    } else if (heap.is_float(x)) {
      const arg1 = heap.get_float(x)
      const res = heap.allocate_float(func(arg1))
      return res
    } else throw Error('Error Expected Number')
  }
}

type UnaryOpFunc = (x: number, heap: Heap) => number
type UnaryOpType = Record<string, UnaryOpFunc>

// NOTE: Leaving out "indirection", "address" and "receive" unary op to be implemented as an exception in executor
const unary_op: UnaryOpType = {
  plus: unary_float_to_num_func((x: number) => x),
  negation: unary_float_to_num_func((x: number) => -x),
  not: unary_bool_to_bool_func((x: boolean) => !x),
  bitwise_complement: unary_num_to_num_func((x: number) => ~x),
}

export { binary_op, unary_op }
