import { useContext } from 'react'

import { ConfirmContext } from 'Contexts/ConfirmContext'

const useConfirm = () => useContext(ConfirmContext).confirm

export default useConfirm
