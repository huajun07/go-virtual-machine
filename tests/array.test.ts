import { describe, expect, test } from 'vitest'

import { mainRunner } from './utility'

describe('Array Type Checking', () => {
  test('Array literal with more elements than in the type should fail.', () => {
    expect(
      mainRunner('var a [3]int = [3]int{1, 2, 3, 4}').errorMessage,
    ).toEqual(
      'Array literal has 4 elements but only expected 3, in type [3]int64.',
    )
  })

  test('Array literal must have the same type as the declared type.', () => {
    expect(
      mainRunner('var a [3]int = [3]int{1, "wrong type", 3}').errorMessage,
    ).toEqual('Cannot use string as int64 value in array literal.')
  })

  test('Array indexing with non integer type should fail.', () => {
    expect(
      mainRunner('var a [3]int = [3]int{1, 2, 3}; return a[1.2]').errorMessage,
    ).toEqual('Invalid argument: Index has type float64 but must be an integer')
  })
})

describe('Array Execution', () => {
  test('Array indexing with valid index works.', () => {
    expect(
      mainRunner('var a [3]string = [3]string{"a", "b", "c"}\n return a[2]')
        .output,
    ).toEqual('"c"')
  })

  test('Array indexing with negative index fails.', () => {
    expect(
      mainRunner('var a [3]string = [3]string{"a", "b", "c"}\n return a[-1]')
        .errorMessage,
    ).toEqual('Index out of range [-1] with length 3')
  })

  test('Array indexing with out of range index fails.', () => {
    expect(
      mainRunner('var a [3]string = [3]string{"a", "b", "c"}\n return a[3]')
        .errorMessage,
    ).toEqual('Index out of range [3] with length 3')
  })

  test('Nested arrays work.', () => {
    expect(
      mainRunner(
        'a := [3][3]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}; return a[1][2]',
      ).output,
    ).toEqual('6')
  })
})