import { useContext } from 'react'

import { PromptContext } from 'Contexts/Prompt'

const usePrompt = () => useContext(PromptContext)

export default usePrompt
