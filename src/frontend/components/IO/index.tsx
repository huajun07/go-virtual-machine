import { Box } from '@chakra-ui/react'

import { TextIDE } from './TextIDE'

interface IOProps {
  output?: string | null
}

export const IO = (props: IOProps) => {
  return (
    <>
      <Box h="20%" borderTop="1px" borderColor="gray.300">
        <TextIDE
          placeholder="Output will appear here"
          text={props.output || ''}
          editable={false}
        />
      </Box>
    </>
  )
}
