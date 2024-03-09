type OperatorToken = {
  type: 'binary_operator' | 'unary_operator'
  name: string
  children: Token[]
}

type LiteralToken = {
  type: 'literal'
  value: unknown
}

type Token = OperatorToken | LiteralToken
