import { describe, expect, test } from 'vitest'

import { runCode } from '../src/virtual-machine'

describe('Variable Declaration Tests', () => {
  test('Const Variables', () => {
    expect(
      runCode(
        'package main;\
        import "fmt";\
        func main() {\
            var a int = 3;\
            const b int = 5;\
            const c int = b;\
            a+b+c;\
        };',
        2048,
      ).output,
    ).toEqual('13')
  })
})
