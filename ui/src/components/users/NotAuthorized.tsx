import React from 'react'
import { Link } from 'react-router-dom'
import { Message } from 'react-bulma-components'

/** Shown when a signed-in user opens a page their roles don't allow. */
const NotAuthorized: React.FC = () => (
  <Message color="danger">
    <Message.Header>Not authorized</Message.Header>
    <Message.Body>
      You do not have permission to view this page. <Link to="/">Go back home</Link>.
    </Message.Body>
  </Message>
)

export default NotAuthorized
