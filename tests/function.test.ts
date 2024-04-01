import { describe, expect, test } from 'vitest'

import { mainRunner } from './utility'

describe('Function Type Checking', () => {
  test('Function assignment', () => {
    expect(
      mainRunner('var a func(int, int) = func(int, int, int) {}').errorMessage,
    ).toEqual(
      'Cannot use func(int64, int64, int64) as func(int64, int64) in variable declaration',
    )
  })
})
