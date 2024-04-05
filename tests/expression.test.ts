import { describe, expect, test } from 'vitest'

import { mainRunner } from './utility'

describe('Basic Expression Tests', () => {
  test('Basic Arithmetic 1', () => {
    expect(mainRunner('Println(5 * -1 + 3 * 4 / 2 + 3)').output).toEqual('4\n')
  })
  test('Basic Arithmetic 2', () => {
    expect(mainRunner('Println((4+3)*5%(5+3)+2)').output).toEqual('5\n')
  })
  test('Boolean Expression', () => {
    expect(
      mainRunner('Println((2+1 < 3) || (7 == 9%5 + 15/5))').output,
    ).toEqual('true\n')
  })
})
