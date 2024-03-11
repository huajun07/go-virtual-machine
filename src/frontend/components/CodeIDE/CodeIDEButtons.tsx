import { AiFillCaretRight } from 'react-icons/ai'
import {
  Box,
  Button,
  Flex,
  Icon,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spacer,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'

interface CodeIDEButtonProps {
  isDisabled: boolean
  toggleMode: () => void
  heapsize: number
  setHeapsize: (x: number) => void
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
        <Box p="10px">Heap Size:</Box>
        <NumberInput
          backgroundColor="white"
          w="20%"
          step={5}
          value={props.heapsize}
          onChange={(value) => props.setHeapsize(parseInt(value))}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
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
