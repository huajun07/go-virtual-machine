import { describe, expect, test } from 'vitest'

import { mainRunner } from './utility'

describe('Channel Type Checking', () => {
  test('Assign int to channel should fail', () => {
    expect(mainRunner('var a <-chan int = 1').errorMessage).toEqual(
      'Cannot use int64 as <-chan int64 in variable declaration',
    )
  })
})
