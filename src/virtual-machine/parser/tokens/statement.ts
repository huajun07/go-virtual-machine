import { Token } from './base'
import { BinaryOperator, UnaryOperator } from './operator'

//! TODO (P1): Add other types of statements and expressions

export type ExpressionToken = UnaryOperator | BinaryOperator

export type StatementToken = ExpressionToken
