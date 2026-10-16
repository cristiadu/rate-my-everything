import React from 'react'
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react'
import ApiConfig from '@/config/ApiConfig'
import { UserRole, getGetCommentsByItemUrl, type CommentResponse } from '@/api/generated/api'
import InterestDiscussion from '@/components/interests/InterestDiscussion'
import { AuthProvider } from '@/components/users/AuthContext'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import { myComment, otherUserComment } from '@/components/tests/common/Comments'
import { duneItem } from '@/components/tests/common/Interests'

/** Comments endpoint of the Dune discussion. */
const DUNE_COMMENTS_URL = `${ApiConfig.API_URL}${getGetCommentsByItemUrl(duneItem.id)}`

/** Answers the mocked discussion with the given comments, and every write with 201 or 204. */
const respondWith = (comments: CommentResponse[]) => async (_url: RequestInfo | URL, init?: RequestInit) => {
  if (init?.method === 'POST') return jsonResponse(myComment, 201)
  if (init?.method === 'DELETE') return jsonResponse({}, 204)
  return jsonResponse(comments)
}

/** Renders the Dune discussion inside the auth provider. */
const renderDiscussion = () => render(
  <AuthProvider>
    <InterestDiscussion itemId={duneItem.id} />
  </AuthProvider>,
)

describe('InterestDiscussion', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    fetchMock = mockFetch()
    jest.spyOn(window, 'confirm').mockReturnValue(true)
  })

  test('lists everyone\'s comments and only lets me delete mine', async () => {
    // GIVEN a plain user and a discussion with my comment and another user's
    loginAs([UserRole.USER])
    fetchMock.mockImplementation(respondWith([myComment, otherUserComment]))

    // WHEN the discussion loads
    renderDiscussion()

    // THEN both comments show in order, with a delete button only on mine
    expect(await screen.findByText('Best sci-fi ever written')).toBeInTheDocument()
    expect(screen.getAllByRole('article').map((article) => article.querySelector('strong')?.textContent)).toEqual(['admin', 'paul'])
    expect(screen.getByRole('button', { name: 'Delete comment by admin' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete comment by paul' })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe(DUNE_COMMENTS_URL)
  })

  test('lets a moderator delete anyone\'s comment', async () => {
    // GIVEN a moderator and another user's comment
    loginAs([UserRole.MODERATOR, UserRole.USER])
    fetchMock.mockImplementation(respondWith([otherUserComment]))
    renderDiscussion()

    // WHEN the moderator deletes it
    fireEvent.click(await screen.findByRole('button', { name: 'Delete comment by paul' }))

    // THEN the comment is deleted through the API
    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true))
    expect(fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE')?.[0]).toBe('http://localhost:3000/api/comments/701')
  })

  test('posts a comment and clears the form', async () => {
    // GIVEN an empty discussion
    loginAs([UserRole.USER])
    fetchMock.mockImplementation(respondWith([]))
    renderDiscussion()
    expect(await screen.findByText('No comments yet. Start the discussion.')).toBeInTheDocument()

    // WHEN I write a comment and post it
    fireEvent.change(screen.getByLabelText('Add a comment'), { target: { value: 'Best sci-fi ever written' } })
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))

    // THEN it is sent for this item and the form is emptied
    await waitFor(() => expect(screen.getByLabelText('Add a comment')).toHaveValue(''))
    const [, postInit] = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST') ?? []
    expect(fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')?.[0]).toBe('http://localhost:3000/api/comments/item/100')
    expect(JSON.parse(String(postInit?.body))).toEqual({ body: 'Best sci-fi ever written' })
  })

  test('keeps the post button disabled for a blank comment', async () => {
    // GIVEN an empty discussion
    loginAs([UserRole.USER])
    fetchMock.mockImplementation(respondWith([]))
    renderDiscussion()
    await screen.findByText('No comments yet. Start the discussion.')

    // WHEN only whitespace is typed
    fireEvent.change(screen.getByLabelText('Add a comment'), { target: { value: '   ' } })

    // THEN the comment cannot be posted
    expect(screen.getByRole('button', { name: 'Post comment' })).toBeDisabled()
  })
})
