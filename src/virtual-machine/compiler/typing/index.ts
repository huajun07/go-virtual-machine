export abstract class Type {
  abstract isPrimitive(): boolean
  abstract toString(): string

  equals(t: unknown): boolean {
    // Note: If this is too slow, we can speed it up by recursively comparing
    // without converting them to strings first.
    return t instanceof Type && this.toString() === t.toString()
  }
}

/** This type represents things that don't have an associated type, like statements. */
export class NoType extends Type {
  isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return ''
  }
}

export class BoolType extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'bool'
  }
}

export class Uint64Type extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'uint64'
  }
}

export class Int64Type extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'int64'
  }
}

export class Float64Type extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'float64'
  }
}

export class StringType extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'string'
  }
}

export class ArrayType extends Type {
  constructor(public element: Type, public length: number) {
    super()
  }

  isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return `[${this.length}]${this.element.toString()}`
  }
}

export class SliceType extends Type {
  constructor(public element: Type) {
    super()
  }

  isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return `[]${this.element.toString()}`
  }
}

export class ParameterType extends Type {
  constructor(public identifier: string | null, public type: Type) {
    super()
  }

  override isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return this.identifier === null
      ? `${this.type}`
      : `${this.identifier} ${this.type}`
  }
}

export class FunctionType extends Type {
  constructor(
    public parameters: ParameterType[],
    public results: ParameterType[],
  ) {
    super()
  }

  override isPrimitive(): boolean {
    return false
  }

  toString(): string {
    const parametersString = this.parameters.map((p) => p.toString()).join(', ')
    const resultsString = this.results.map((r) => r.toString()).join(', ')
    if (this.results.length === 0) {
      return `func(${parametersString})`
    }
    if (this.results.length === 1) {
      return `func(${parametersString}) ${resultsString}`
    }
    return `func(${parametersString}) (${resultsString})`
  }
}

export const TypeUtility = {
  // Similar to Array.toString(), but adds a space after each comma.
  arrayToString(types: Type[] | null) {
    return (types ?? []).map((t) => t.toString()).join(', ')
  },
}
