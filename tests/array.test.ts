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
})
