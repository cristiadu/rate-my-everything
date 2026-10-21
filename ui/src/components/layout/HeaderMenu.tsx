import React, { useState } from 'react'
import { Navbar } from 'react-bulma-components'
import { useAuth } from '@/components/users/AuthContext'
import { canModerate, getRolesFromToken } from '@/components/admin/RequireAdmin'
import { UserRole } from '@/api/generated/api'

/** Path prefix shared by every admin page, used to mark the Admin menu as current. */
const ADMIN_PATH_PREFIX = '/admin'

/** Whether the browser is on the given top menu path, so its item can be marked as current. */
const isCurrentPath = (path: string): boolean => window.location.pathname === path

const HeaderMenu = () => {
  const [isActive, setActive] = useState(false)
  const { isAuthenticated, token } = useAuth()

  return (
    <Navbar active={isActive} color="danger">
      {/* The menu lines up with the header's title on wide screens */}
      <div className="container is-fullhd">
        <Navbar.Brand>
          <Navbar.Item renderAs="a" href="/">
            <img
              alt="RaMyEv"
              height="28"
              src="/images/logo.svg"
              width="106"
            />
          </Navbar.Item>
          <Navbar.Burger onClick={() => setActive(!isActive)} />
        </Navbar.Brand>
        <Navbar.Menu>
          <Navbar.Container align="left">
            {isAuthenticated && (
              <Navbar.Item renderAs="a" href="/account" active={isCurrentPath('/account')}>
                My Account
              </Navbar.Item>
            )}
            {isAuthenticated && (
              <>
                <Navbar.Item renderAs="a" href="/rankings" active={isCurrentPath('/rankings')}>
                  My interests
                </Navbar.Item>
                <Navbar.Item renderAs="a" href="/all_rankings" active={isCurrentPath('/all_rankings')}>
                  All rankings
                </Navbar.Item>
                <Navbar.Item renderAs="a" href="/interests/import" active={isCurrentPath('/interests/import')}>
                  Import interests
                </Navbar.Item>
              </>
            )}
            {isAuthenticated && (
              <>
                <Navbar.Item renderAs="a" href="/categories" active={isCurrentPath('/categories')}>
                  Categories
                </Navbar.Item>
                <Navbar.Item renderAs="a" href="/change-requests" active={isCurrentPath('/change-requests')}>
                  My change requests
                </Navbar.Item>
              </>
            )}
            {canModerate(token) && (
              <Navbar.Item renderAs="a" href="/moderation" active={isCurrentPath('/moderation')}>
                Moderation
              </Navbar.Item>
            )}
            {getRolesFromToken(token).includes(UserRole.ADMIN) && (
              <Navbar.Item hoverable>
                <Navbar.Link
                  renderAs="a"
                  href="/admin"
                  className={window.location.pathname.startsWith(ADMIN_PATH_PREFIX) ? 'is-active' : undefined}
                >
                  Admin
                </Navbar.Link>
                <Navbar.Dropdown>
                  <Navbar.Item renderAs="a" href="/admin" active={isCurrentPath('/admin')}>
                    Dashboard
                  </Navbar.Item>
                  <Navbar.Item renderAs="a" href="/admin/users" active={isCurrentPath('/admin/users')}>
                    Users
                  </Navbar.Item>
                  <Navbar.Item renderAs="a" href="/admin/attributes" active={isCurrentPath('/admin/attributes')}>
                    Attributes
                  </Navbar.Item>
                </Navbar.Dropdown>
              </Navbar.Item>
            )}
          </Navbar.Container>
        </Navbar.Menu>
      </div>
    </Navbar>
  )
}

export default HeaderMenu
