import React, { useState } from 'react'
import { Navbar } from 'react-bulma-components'
import { useAuth } from '@/components/users/AuthContext'
import { useIsAdmin } from '@/components/users/sessionRoles'

const HeaderMenu = () => {
  const [isActive, setActive] = useState(false)
  const { isAuthenticated } = useAuth()
  const isAdmin = useIsAdmin()

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
            <>
              <Navbar.Item renderAs="a" href="/rankings">
                My interests
              </Navbar.Item>
              <Navbar.Item renderAs="a" href="/all_rankings">
                All rankings
              </Navbar.Item>
              <Navbar.Item renderAs="a" href="/categories">
                Categories
              </Navbar.Item>
            </>
          )}
          {isAdmin && (
            <Navbar.Item renderAs="a" href="/attributes">
              Attributes
            </Navbar.Item>
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
