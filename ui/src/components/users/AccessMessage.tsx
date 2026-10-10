import React from 'react'
import { Message } from 'react-bulma-components'
import type { AccessMessageProps } from '@/components/types'

/** Shown in place of a page the visitor can't open, explaining why. */
const AccessMessage: React.FC<AccessMessageProps> = ({ title, children }) => (
  <Message color="danger">
    <Message.Header>{title}</Message.Header>
    <Message.Body>{children}</Message.Body>
  </Message>
)

export default AccessMessage
