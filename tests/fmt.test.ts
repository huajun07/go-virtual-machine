import { describe, expect, test } from 'vitest'

import { mainRunner } from './utility'

describe('fmt Type Checking', () => {
  test('Selector on fmt should fail unless it is Println.', () => {
    const code = `
    fmt.nonexistent("hi")
    `
    expect(mainRunner(code).errorMessage).toEqual('undefined: fmt.nonexistent')
  })
})

describe('fmt Execution', () => {
  test('Println works', () => {
    const code = `
    Println("Hello", "world", true, false)
    Println(1, 2, 3, 4)
    `
    expect(mainRunner(code).output).toEqual('Hello world true false\n1 2 3 4\n')
  })
})
