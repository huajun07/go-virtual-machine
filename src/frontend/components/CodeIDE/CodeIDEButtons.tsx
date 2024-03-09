import { AiFillCaretRight } from 'react-icons/ai'
import {
  Button,
  Flex,
  Icon,
  Spacer,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'

interface CodeIDEButtonProps {
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
        <Tooltip label={'Paste the code below and run it!'}>
          <Button
            marginRight="10px"
            size="sm"
            rightIcon={<Icon as={AiFillCaretRight} />}
            colorScheme="blue"
            variant="solid"
            onClick={props.toggleMode}
            isDisabled={props.isDisabled}
          >
            {'Run'}
          </Button>
        </Tooltip>
      </Flex>
    </>
  )
}
