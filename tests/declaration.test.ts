import { describe, expect, test } from 'vitest'

import { mainRunner } from './utility'

describe('Variable Declaration Tests', () => {
  test('Const Variables', () => {
    expect(
      mainRunner(
        'var a int = 3;\
        const b int = 5;\
        const c int = b;\
        Println(a+b+c)',
      ).output,
    ).toEqual('13\n')
  })

  test('String Variables', () => {
    expect(
      mainRunner(
        'a := "hi";\
        b := "hi2";\
        Println(a + b)',
      ).output,
    ).toEqual('hihi2\n')
  })

  test('Boolean constants true and false are predeclared', () => {
    const code = `
    if false {
      Println("false")
    }
    if true {
      Println("true")
    }
    `
    expect(mainRunner(code).output).toEqual('true\n')
  })

  test('Boolean constants true and false can be shadowed by local declaration', () => {
    const code = `
    true := false
    false := true
    if false {
      Println("false")
    }
    if true {
      Println("true")
    }
    `
    expect(mainRunner(code).output).toEqual('')
  })
})
