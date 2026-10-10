import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Columns, Heading, Menu } from 'react-bulma-components'

/** Entries in the admin side menu; `end` makes the link active only on an exact path match. */
const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users', end: false },
]

/** Admin area shell: side menu plus the selected admin page. */
const AdminLayout: React.FC = () => (
  <Columns>
    <Columns.Column size={3}>
      <Menu>
        <Menu.List title="Administration">
          {adminLinks.map(({ to, label, end }) => (
            <li key={to} style={{ listStyle: 'none' }}>
              <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {label}
              </NavLink>
            </li>
          ))}
        </Menu.List>
      </Menu>
    </Columns.Column>
    <Columns.Column>
      <Heading size={4} renderAs="h2">Admin Area</Heading>
      <Outlet />
    </Columns.Column>
  </Columns>
)

export default AdminLayout
