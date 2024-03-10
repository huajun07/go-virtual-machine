import { runCode } from '../src/virtual-machine'

describe('Basic Expression Tests', () => {
  test('Basic Arithmetic 1', () => {
    expect(runCode('5 * -1 + 3 * 4 / 2 + 3').output).toEqual('4')
  })
  test('Basic Arithmetic 2', () => {
    expect(runCode('(4+3)*5%(5+3)+2').output).toEqual('5')
  })
  test('Boolean Expression', () => {
    expect(runCode('(2+1 < 3) || (7 == 9%5 + 15/5)').output).toEqual('true')
  })
})
