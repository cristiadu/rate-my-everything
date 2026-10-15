import React, { useState } from 'react'
import { Navbar } from 'react-bulma-components'
import { useAuth } from '@/components/users/AuthContext'
import { canModerate, getRolesFromToken } from '@/components/admin/RequireAdmin'
import { UserRole } from '@/api/generated/api'

const HeaderMenu = () => {
  const [isActive, setActive] = useState(false)
  const { isAuthenticated, token } = useAuth()

  return (
    <Navbar active={isActive} color="danger">
      <Navbar.Brand>
        <Navbar.Item href="#">
          <img
            alt="Icon"
            height="28"
            src="/favicon.ico"
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
            <Navbar.Item renderAs="a" href="/account">
              My Account
            </Navbar.Item>
          )}
          {isAuthenticated && (
            <>
              <Navbar.Item renderAs="a" href="/rankings">
                My interests
              </Navbar.Item>
              <Navbar.Item renderAs="a" href="/all_rankings">
                All rankings
              </Navbar.Item>
              <Navbar.Item renderAs="a" href="/interests/import">
                Import interests
              </Navbar.Item>
            </>
          )}
          {isAuthenticated && (
            <>
              <Navbar.Item renderAs="a" href="/categories">
                Categories
              </Navbar.Item>
              <Navbar.Item renderAs="a" href="/change-requests">
                My change requests
              </Navbar.Item>
            </>
          )}
          {canModerate(token) && (
            <Navbar.Item renderAs="a" href="/moderation">
              Moderation
            </Navbar.Item>
          )}
          {getRolesFromToken(token).includes(UserRole.ADMIN) && (
            <Navbar.Item hoverable>
              <Navbar.Link renderAs="a" href="/admin">
                Admin
              </Navbar.Link>
              <Navbar.Dropdown>
                <Navbar.Item renderAs="a" href="/admin">
                  Dashboard
                </Navbar.Item>
                <Navbar.Item renderAs="a" href="/admin/users">
                  Users
                </Navbar.Item>
                <Navbar.Item renderAs="a" href="/admin/attributes">
                  Attributes
                </Navbar.Item>
              </Navbar.Dropdown>
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
