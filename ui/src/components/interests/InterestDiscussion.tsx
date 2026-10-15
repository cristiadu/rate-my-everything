import React, { useCallback, useEffect, useState } from 'react'
import { Message } from 'react-bulma-components'
import { createComment, deleteComment, getCommentsByItem } from '@/api/generated/api'
import { MAX_COMMENT_LENGTH, UserRole, type Comment } from '@/components/types'
import { getRolesFromToken, getUsernameFromToken } from '@/components/admin/RequireAdmin'
import { useAuth } from '@/components/users/AuthContext'

/** Roles that may delete anyone's comment; mirrors the API's rule. */
const MODERATING_ROLES = [UserRole.ADMIN, UserRole.MODERATOR]

/** Props for an interest's discussion thread. */
interface InterestDiscussionProps {
    itemId: number;
}

/** Discussion thread of an interest: everyone's comments, oldest first, and a form to post one. */
const InterestDiscussion: React.FC<InterestDiscussionProps> = ({ itemId }) => {
  const { token } = useAuth()
  const username = getUsernameFromToken(token)
  const isModerator = getRolesFromToken(token).some((role) => MODERATING_ROLES.includes(role))
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  const loadComments = useCallback(async () => {
    try {
      setComments(await getCommentsByItem(itemId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the discussion')
    }
  }, [itemId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPosting(true)
    setError('')
    try {
      await createComment(itemId, { body: draft })
      setDraft('')
      await loadComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post the comment')
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (comment: Comment) => {
    if (!window.confirm('Delete this comment?')) {
      return
    }

    setError('')
    try {
      await deleteComment(comment.id)
      await loadComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete the comment')
    }
  }

  return (
    <section aria-labelledby="discussion-title">
      <h3 className="title is-5" id="discussion-title">Discussion</h3>
      {error && (
        <Message color="danger">
          <Message.Body>{error}</Message.Body>
        </Message>
      )}
      {comments?.length === 0 && <p>No comments yet. Start the discussion.</p>}
      {comments?.map((comment) => (
        <article className="media" key={comment.id}>
          <div className="media-content">
            <p>
              <strong>{comment.user.username}</strong>
              {' '}
              <small>{new Date(comment.createdAt).toLocaleString()}</small>
            </p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{comment.body}</p>
          </div>
          {(comment.user.username === username || isModerator) && (
            <div className="media-right">
              <button
                type="button"
                className="delete"
                aria-label={`Delete comment by ${comment.user.username}`}
                onClick={() => handleDelete(comment)}
              />
            </div>
          )}
        </article>
      ))}
      <div className="box mt-4">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="comment-body">Add a comment</label>
            <div className="control">
              <textarea
                className="textarea"
                id="comment-body"
                maxLength={MAX_COMMENT_LENGTH}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className={`button is-primary${isPosting ? ' is-loading' : ''}`} disabled={isPosting || !draft.trim()}>
            Post comment
          </button>
        </form>
      </div>
    </section>
  )
}

export default InterestDiscussion
