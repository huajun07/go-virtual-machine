import { AiFillCaretRight } from 'react-icons/ai'
import { MdEdit } from 'react-icons/md'
import {
  Button,
  Flex,
  Icon,
  Spacer,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'

interface CodeIDEButtonProps {
  editing: boolean
  isDisabled: boolean
  toggleMode: () => void
}

export const CodeIDEButtons = (props: CodeIDEButtonProps) => {
  return (
    <>
      <Flex
        background={useColorModeValue('gray.100', 'gray.700')}
        minWidth="max-content"
        alignItems="center"
        gap="2"
        h="60px"
      >
        <Spacer />
        <Tooltip
          label={
            props.editing
              ? 'Paste the code below and run it!'
              : 'Stop the simulation and edit your code'
          }
        >
          <Button
            marginRight="10px"
            size="sm"
            rightIcon={<Icon as={props.editing ? AiFillCaretRight : MdEdit} />}
            colorScheme="blue"
            variant="solid"
            onClick={props.toggleMode}
            isDisabled={props.isDisabled}
          >
            {props.editing ? 'Run' : 'Edit'}
          </Button>
        </Tooltip>
      </Flex>
    </>
  )
}
