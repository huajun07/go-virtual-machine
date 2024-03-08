//! TODO: Type check expected type and return/throw error if invalid
// Currently temporarily cast to expected type
type BinaryOpFunc = (x:unknown, y:unknown) => unknown
type BinaryOpType = Record<string, BinaryOpFunc>

const rel_op: BinaryOpType = {
    equal: (x:unknown, y:unknown) => x === y,
    not_equal: (x:unknown, y:unknown) => x!==y,
    less: (x: unknown, y:unknown) => (x as number) < (y as number),
    less_or_equal: (x: unknown, y:unknown) => (x as number) <= (y as number),
    greater: (x: unknown, y:unknown) => (x as number) > (y as number),
    greater_or_equal: (x: unknown, y:unknown) => (x as number) >= (y as number),
}

const add_op: BinaryOpType = {
    sum: (x: unknown, y:unknown) => (x as number) + (y as number),
    difference: (x: unknown, y:unknown) => (x as number) - (y as number),
    bitwise_or: (x: unknown, y:unknown) => (x as number) | (y as number),
    bitwise_xor: (x: unknown, y:unknown) => (x as number) ^ (y as number),
}

const mul_op: BinaryOpType = {
    product: (x: unknown, y:unknown) => (x as number) * (y as number),
    quotient: (x: unknown, y:unknown) => (x as number) / (y as number),
    remainder: (x: unknown, y:unknown) => (x as number) % (y as number),
    left_shift: (x: unknown, y:unknown) => (x as number) << (y as number),
    right_shift: (x: unknown, y:unknown) => (x as number) >> (y as number),
    bitwise_and: (x: unknown, y:unknown) => (x as number) & (y as number),
    bit_clear: (x: unknown, y:unknown) => (x as number) & ~(y as number),
}

const binary_op: BinaryOpType = {
    conditional_or: (x : unknown, y: unknown) => x || y,
    conditional_and: (x:unknown, y:unknown) => x && y,
    ...rel_op,
    ...add_op,
    ...mul_op
}


type UnaryOpFunc = (x:unknown) => unknown
type UnaryOpType = Record<string, UnaryOpFunc>

// NOTE: Leaving out "indirection", "address" and "receive" unary op to be implemented as an exception in executor
const unary_op: UnaryOpType = {
    plus: (x: unknown) => (x as number),
    negation: (x: unknown) => -(x as number),
    not: (x: unknown) => !x,
    bitwise_complement: (x: unknown) =>  ~(x as number),
}


export {binary_op, unary_op}