import React, { useState } from 'react'
import { Navbar } from 'react-bulma-components'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/users/AuthContext'
import UserRole from '@/components/users/UserRole'

const HeaderMenu = () => {
  const [isActive, setActive] = useState(false)
  const { isAuthenticated, hasRole } = useAuth()

  return (
    <Navbar active={isActive} color="danger">
      <Navbar.Brand>
        <Navbar.Item href="#">
          <img
            alt="Icon"
            height="28"
            src="./favicon.ico"
            width="28"
          />
        </Navbar.Item>
        <Navbar.Burger onClick={() => setActive(!isActive)} />
      </Navbar.Brand>
      <Navbar.Menu>
        <Navbar.Container align="left">
          <Navbar.Item href="#" hoverable>
            <Navbar.Link>
              First
            </Navbar.Link>
            <Navbar.Dropdown>
              <Navbar.Item href="#">
                Subitem 1
              </Navbar.Item>
              <Navbar.Item href="#">
                Subitem 2
              </Navbar.Item>
              <Navbar.Divider />
              <Navbar.Item href="#">
                After divider
              </Navbar.Item>
            </Navbar.Dropdown>
          </Navbar.Item>
          <Navbar.Item href="#">
            Second
          </Navbar.Item>
          {isAuthenticated && (
            <Link className="navbar-item" to="/account">My Account</Link>
          )}
          {hasRole(UserRole.ADMIN) && (
            <div className="navbar-item has-dropdown is-hoverable">
              <Link className="navbar-link" to="/admin">Admin</Link>
              <div className="navbar-dropdown">
                <Link className="navbar-item" to="/admin">Dashboard</Link>
                <Link className="navbar-item" to="/admin/users">Users</Link>
              </div>
            </div>
          )}
        </Navbar.Container>
        <Navbar.Container align="right">
          <Navbar.Item href="#">
            At the end
          </Navbar.Item>
        </Navbar.Container>
      </Navbar.Menu>
    </Navbar>
  )
}

export default HeaderMenu
