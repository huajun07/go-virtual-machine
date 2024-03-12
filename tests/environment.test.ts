import { describe, expect, test } from 'vitest'

import { runCode } from '../src/virtual-machine'

describe('Basic Environment Tests', () => {
  test('Number Variables', () => {
    expect(
      runCode(
        'package main;\
        import "fmt";\
        func main() {\
          var a int = 3;\
          b:= a + 3;\
          c := a + b;\
          c *= a;\
          a + b + c;\
        };',
        2048,
      ).output,
    ).toEqual('36')
  })
  test('Number Variables Scoping', () => {
    expect(
      runCode(
        'package main;\
        import "fmt";\
        func main() {\
          var a int = 3;\
          {\
            var a int = 1;\
            a = 2;\
          };\
          a;\
        };',
        2048,
      ).output,
    ).toEqual('3')
  })
})
