import peggy from 'peggy'

// eslint-disable-next-line import/no-webpack-loader-syntax
import grammar from '!!raw-loader!./parser.peggy'

const parser = peggy.generate(grammar)

export default parser
