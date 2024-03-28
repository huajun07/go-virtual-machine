import { describe, expect, test } from 'vitest'

import { mainRunner } from './utility'

describe('Basic Expression Tests', () => {
  test('Basic Arithmetic 1', () => {
    expect(mainRunner('return 5 * -1 + 3 * 4 / 2 + 3').output).toEqual('4')
  })
  test('Basic Arithmetic 2', () => {
    expect(mainRunner('return (4+3)*5%(5+3)+2').output).toEqual('5')
  })
  test('Boolean Expression', () => {
    expect(mainRunner('return (2+1 < 3) || (7 == 9%5 + 15/5)').output).toEqual(
      'true',
    )
  })
})
