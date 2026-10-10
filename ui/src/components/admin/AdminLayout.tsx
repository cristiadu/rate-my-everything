import React from 'react'
import { Outlet } from 'react-router-dom'
import { Heading } from 'react-bulma-components'

/** Admin area shell: a common heading above the selected admin page. */
const AdminLayout: React.FC = () => (
  <>
    <Heading size={4} renderAs="h2">Admin Area</Heading>
    <Outlet />
  </>
)

export default AdminLayout
