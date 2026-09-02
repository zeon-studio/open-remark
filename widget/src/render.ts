import type { CommentData, AuthState, Commenter } from "./types"
import { MAX_CHARS_COMMENT, MAX_CHARS_EDIT } from "./constants"

export interface CommentHandlers {
  onReply: (comment: CommentData) => void
  onLike: (comment: CommentData) => void
  onEdit: (comment: CommentData) => void
  onCancelEdit: () => void
  onSubmitEdit: (commentId: string, body: string) => void
  onDelete: (comment: CommentData) => void
  onCancelDelete: () => void
  onConfirmDelete: (commentId: string) => void
  onSubmitReply: (body: string, parentId: string) => void
  onCancelReply: () => void
}

export interface CommentState {
  replyingToId: string | null
  editingId: string | null
  deletingId: string | null
  isSubmitting: boolean
  currentUser: Commenter | null
  likingIds: Set<string>
}

interface InlineFormConfig {
  headerLabel: string | null
  currentUser: Commenter | null
  initialValue: string
  placeholder: string
  ariaLabel: string
  maxChars: number
  submitLabel: string
  submittingLabel: string
  isSubmitting: boolean
  onSubmit: (body: string) => void | Promise<void>
  onCancel: () => void
}

function renderInlineForm(cfg: InlineFormConfig): HTMLElement {
  const wrap = document.createElement("div")
  wrap.className = "z-inline-form"

  if (cfg.headerLabel && cfg.currentUser) {
    const header = document.createElement("div")
    header.className = "z-inline-form-header"
    header.appendChild(
      avatarEl(cfg.currentUser.name, cfg.currentUser.image, true)
    )
    const label = document.createElement("span")
    label.className = "z-inline-form-label"
    label.textContent = cfg.headerLabel
    header.appendChild(label)
    wrap.appendChild(header)
  }

  const textarea = document.createElement("textarea")
  textarea.value = cfg.initialValue
  textarea.placeholder = cfg.placeholder
  textarea.setAttribute("aria-label", cfg.ariaLabel)
  textarea.rows = 2
  textarea.disabled = cfg.isSubmitting
  wrap.appendChild(textarea)

  const footer = document.createElement("div")
  footer.className = "z-inline-form-footer"

  const counter = document.createElement("span")
  counter.className = "z-char-counter"
  counter.setAttribute("aria-live", "polite")
  counter.textContent = `${cfg.initialValue.length} / ${cfg.maxChars}`
  footer.appendChild(counter)

  const btnWrap = document.createElement("div")
  btnWrap.className = "z-inline-form-btns"

  const cancelBtn = document.createElement("button")
  cancelBtn.className = "z-btn z-btn-ghost z-btn-sm"
  cancelBtn.type = "button"
  cancelBtn.textContent = "Cancel"
  cancelBtn.addEventListener("click", cfg.onCancel)
  btnWrap.appendChild(cancelBtn)

  const submitBtn = document.createElement("button")
  submitBtn.className = "z-btn z-btn-primary z-btn-sm"
  submitBtn.type = "button"
  submitBtn.textContent = cfg.isSubmitting
    ? cfg.submittingLabel
    : cfg.submitLabel
  submitBtn.disabled = cfg.isSubmitting || cfg.initialValue.length === 0
  submitBtn.addEventListener("click", async () => {
    const body = textarea.value.trim()
    if (!body || body.length > cfg.maxChars) {
      textarea.focus()
      return
    }
    await cfg.onSubmit(body)
  })
  btnWrap.appendChild(submitBtn)
  footer.appendChild(btnWrap)
  wrap.appendChild(footer)

  textarea.addEventListener("input", () => {
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
    const len = textarea.value.length
    counter.textContent = `${len} / ${cfg.maxChars}`
    counter.classList.toggle(
      "z-char-counter-warn",
      len >= cfg.maxChars * 0.9 && len < cfg.maxChars
    )
    counter.classList.toggle("z-char-counter-over", len > cfg.maxChars)
    submitBtn.disabled = cfg.isSubmitting || len === 0 || len > cfg.maxChars
  })

  setTimeout(() => textarea.focus(), 0)
  return wrap
}

export function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate))
}

function avatarEl(
  name: string,
  image: string | null,
  small = false
): HTMLElement {
  if (image) {
    const img = document.createElement("img")
    img.src = image
    img.alt = name
    img.className = small ? "z-avatar z-avatar-sm" : "z-avatar"
    img.width = small ? 24 : 30
    img.height = small ? 24 : 30
    return img
  }
  const el = document.createElement("div")
  el.className = small
    ? "z-avatar-placeholder z-avatar-placeholder-sm"
    : "z-avatar-placeholder"
  el.setAttribute("aria-hidden", "true")
  el.textContent = name.slice(0, 2).toUpperCase()
  return el
}

function deletedAvatarEl(small = false): HTMLElement {
  const el = document.createElement("div")
  el.className = small
    ? "z-avatar-deleted z-avatar-deleted-sm"
    : "z-avatar-deleted"
  el.setAttribute("aria-hidden", "true")
  el.innerHTML = `<svg width="${small ? 12 : 14}" height="${small ? 12 : 14}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>`
  return el
}

function renderCommentBody(text: string): HTMLElement {
  const p = document.createElement("p")
  p.className = "z-comment-body"

  const mentionRegex = /@([a-z0-9]+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      p.appendChild(document.createTextNode(text.slice(lastIndex, match.index)))
    }
    const mentionSpan = document.createElement("span")
    mentionSpan.className = "z-comment-mention"
    mentionSpan.textContent = match[0]
    mentionSpan.dataset.username = match[1]
    p.appendChild(mentionSpan)
    lastIndex = mentionRegex.lastIndex
  }

  if (lastIndex < text.length) {
    p.appendChild(document.createTextNode(text.slice(lastIndex)))
  }

  if (p.childNodes.length === 0) {
    p.textContent = text
  }

  return p
}

function renderCommentMeta(
  commenter: CommentData["commenter"],
  status: CommentData["status"]
): HTMLElement {
  const meta = document.createElement("div")
  meta.className = "z-comment-meta"

  const nameEl = document.createElement("span")
  nameEl.className = "z-comment-author"
  nameEl.textContent = commenter.name
  meta.appendChild(nameEl)

  const userEl = document.createElement("span")
  userEl.className = "z-comment-username"
  userEl.textContent = `@${commenter.username}`
  meta.appendChild(userEl)

  if (status === "PENDING") {
    const badge = document.createElement("span")
    badge.className = "z-pending-badge"
    badge.textContent = "Pending"
    meta.appendChild(badge)
  }

  return meta
}

const HEART_OUTLINE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
const HEART_FILLED = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
const REPLY_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`

export function renderCommentItem(
  comment: CommentData,
  depth: number,
  handlers: CommentHandlers,
  state: CommentState
): HTMLElement {
  const {
    onReply,
    onLike,
    onEdit,
    onCancelEdit,
    onSubmitEdit,
    onDelete,
    onCancelDelete,
    onConfirmDelete,
    onSubmitReply,
    onCancelReply,
  } = handlers
  const { replyingToId, editingId, deletingId, isSubmitting, currentUser } =
    state

  const li = document.createElement("li")
  li.className = depth === 0 ? "z-comment" : "z-reply"
  li.dataset.id = comment.id

  const isReplying = replyingToId === comment.id
  const isEditing = editingId === comment.id
  const isTopLevel = depth === 0
  const avatarSize = isTopLevel ? false : true

  if (comment.status === "DELETED") {
    if (comment.banned) {
      const deletedWrap = document.createElement("div")
      deletedWrap.className = "z-comment-deleted"
      deletedWrap.appendChild(deletedAvatarEl(avatarSize))
      const deletedBody = document.createElement("span")
      deletedBody.className = "z-comment-deleted-body"
      deletedBody.textContent = "Account is suspended"
      deletedWrap.appendChild(deletedBody)
      li.appendChild(deletedWrap)
    } else {
      const content = document.createElement("div")
      content.className = "z-comment-content"
      content.appendChild(
        avatarEl(comment.commenter.name, comment.commenter.image, avatarSize)
      )

      const right = document.createElement("div")
      right.className = "z-comment-right"
      right.appendChild(renderCommentMeta(comment.commenter, comment.status))

      const deletedBody = document.createElement("span")
      deletedBody.className = "z-comment-deleted-body"
      deletedBody.textContent = "Comment Removed"
      right.appendChild(deletedBody)

      content.appendChild(right)
      li.appendChild(content)
    }

    if (comment.replies?.length > 0) {
      const repliesList = document.createElement("ul")
      repliesList.className = "z-replies"
      repliesList.setAttribute("aria-label", "Replies")
      for (const reply of comment.replies) {
        repliesList.appendChild(
          renderCommentItem(reply, depth + 1, handlers, state)
        )
      }
      li.appendChild(repliesList)
    }
    return li
  }

  if (comment.status === "SPAM") {
    const content = document.createElement("div")
    content.className = "z-comment-content"
    content.appendChild(
      avatarEl(comment.commenter.name, comment.commenter.image, avatarSize)
    )

    const right = document.createElement("div")
    right.className = "z-comment-right"
    right.appendChild(renderCommentMeta(comment.commenter, comment.status))

    const spamBody = document.createElement("span")
    spamBody.className = "z-comment-deleted-body"
    spamBody.textContent = "Flagged as spam"
    right.appendChild(spamBody)

    content.appendChild(right)
    li.appendChild(content)

    if (comment.replies?.length > 0) {
      const repliesList = document.createElement("ul")
      repliesList.className = "z-replies"
      repliesList.setAttribute("aria-label", "Replies")
      for (const reply of comment.replies) {
        repliesList.appendChild(
          renderCommentItem(reply, depth + 1, handlers, state)
        )
      }
      li.appendChild(repliesList)
    }
    return li
  }

  const content = document.createElement("div")
  content.className = "z-comment-content"

  content.appendChild(
    avatarEl(comment.commenter.name, comment.commenter.image, avatarSize)
  )

  const right = document.createElement("div")
  right.className = "z-comment-right"
  right.appendChild(renderCommentMeta(comment.commenter, comment.status))

  if (!isEditing) {
    const body = renderCommentBody(comment.body)
    right.appendChild(body)

    const actions = document.createElement("div")
    actions.className = "z-comment-actions"

    const timeEl = document.createElement("time")
    timeEl.className = "z-comment-action-time"
    timeEl.dateTime = comment.createdAt
    timeEl.textContent = formatRelativeTime(comment.createdAt)
    actions.appendChild(timeEl)

    const isLiking = state.likingIds.has(comment.id)
    const likeBtn = document.createElement("button")
    likeBtn.className =
      "z-action-btn" +
      (comment.hasLiked || isLiking ? " z-action-btn-active" : "") +
      (isLiking ? " z-action-btn-loading" : "")
    likeBtn.type = "button"
    likeBtn.setAttribute("aria-busy", isLiking ? "true" : "false")
    likeBtn.innerHTML = `${comment.hasLiked || isLiking ? HEART_FILLED : HEART_OUTLINE}<span>${comment.likeCount}</span>`
    likeBtn.addEventListener("click", () => onLike(comment))
    actions.appendChild(likeBtn)

    const replyBtn = document.createElement("button")
    replyBtn.className = "z-action-btn"
    replyBtn.type = "button"
    replyBtn.innerHTML = `${REPLY_ICON}<span>Reply</span>`
    replyBtn.addEventListener("click", () => onReply(comment))
    actions.appendChild(replyBtn)

    if (currentUser && currentUser.id === comment.commenter.id) {
      const menuWrap = document.createElement("div")
      menuWrap.className = "z-comment-actions-wrap"

      const menuBtn = document.createElement("button")
      menuBtn.className = "z-menu-btn"
      menuBtn.type = "button"
      menuBtn.setAttribute("aria-label", "More options")
      menuBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>`

      const dropdown = document.createElement("ul")
      dropdown.className = "z-menu-dropdown"
      dropdown.style.display = "none"

      const editItem = document.createElement("button")
      editItem.className = "z-menu-item"
      editItem.type = "button"
      editItem.textContent = "Edit"
      editItem.addEventListener("click", () => {
        dropdown.style.display = "none"
        onEdit(comment)
      })

      const deleteItem = document.createElement("button")
      deleteItem.className = "z-menu-item z-menu-item-danger"
      deleteItem.type = "button"
      deleteItem.textContent = "Delete"
      deleteItem.addEventListener("click", () => {
        dropdown.style.display = "none"
        onDelete(comment)
      })

      dropdown.appendChild(editItem)
      dropdown.appendChild(deleteItem)
      menuWrap.appendChild(menuBtn)
      menuWrap.appendChild(dropdown)
      actions.appendChild(menuWrap)

      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        const isOpen = dropdown.style.display === "block"
        dropdown.style.display = isOpen ? "none" : "block"
      })
    }

    if (comment.editedAt) {
      const editedEl = document.createElement("span")
      editedEl.className = "z-comment-action-edited"
      editedEl.textContent = "· edited"
      actions.appendChild(editedEl)
    }

    right.appendChild(actions)
  }

  content.appendChild(right)
  li.appendChild(content)

  if (isEditing) {
    const editWrap = document.createElement("div")
    editWrap.className = "z-inline-edit"
    editWrap.appendChild(
      renderInlineEditForm(comment, onSubmitEdit, onCancelEdit, isSubmitting)
    )
    li.appendChild(editWrap)
  }

  if (isReplying && currentUser) {
    const formWrap = document.createElement("div")
    formWrap.className = "z-inline-reply"
    formWrap.appendChild(
      renderInlineReplyForm(
        comment,
        currentUser,
        onSubmitReply,
        onCancelReply,
        isSubmitting
      )
    )
    li.appendChild(formWrap)
  }

  if (deletingId === comment.id) {
    const confirmWrap = document.createElement("div")
    confirmWrap.className = "z-delete-confirm"

    const confirmText = document.createElement("p")
    confirmText.className = "z-delete-confirm-text"
    confirmText.textContent =
      "Delete this comment? This action cannot be undone."
    confirmWrap.appendChild(confirmText)

    const btnWrap = document.createElement("div")
    btnWrap.className = "z-delete-confirm-btns"

    const cancelBtn = document.createElement("button")
    cancelBtn.className = "z-btn z-btn-ghost z-btn-sm"
    cancelBtn.type = "button"
    cancelBtn.textContent = "Cancel"
    cancelBtn.addEventListener("click", onCancelDelete)
    btnWrap.appendChild(cancelBtn)

    const deleteBtn = document.createElement("button")
    deleteBtn.className = "z-btn z-btn-danger z-btn-sm"
    deleteBtn.type = "button"
    deleteBtn.textContent = "Delete"
    deleteBtn.addEventListener("click", () => onConfirmDelete(comment.id))
    btnWrap.appendChild(deleteBtn)

    confirmWrap.appendChild(btnWrap)
    li.appendChild(confirmWrap)
  }

  if (comment.replies?.length > 0) {
    const repliesList = document.createElement("ul")
    repliesList.className = "z-replies"
    repliesList.setAttribute(
      "aria-label",
      `Replies to ${comment.commenter.name}`
    )
    for (const reply of comment.replies) {
      repliesList.appendChild(
        renderCommentItem(reply, depth + 1, handlers, state)
      )
    }
    li.appendChild(repliesList)
  }

  return li
}

function renderInlineReplyForm(
  replyTo: CommentData,
  currentUser: Commenter,
  onSubmit: (body: string, parentId: string) => void,
  onCancel: () => void,
  isSubmitting: boolean
): HTMLElement {
  return renderInlineForm({
    headerLabel: `Reply to ${replyTo.commenter.name}`,
    currentUser,
    initialValue: "",
    placeholder: `Reply to ${replyTo.commenter.name}…`,
    ariaLabel: `Reply to ${replyTo.commenter.name}`,
    maxChars: MAX_CHARS_COMMENT,
    submitLabel: "Reply",
    submittingLabel: "Posting…",
    isSubmitting,
    onSubmit: (body) => onSubmit(body, replyTo.id),
    onCancel,
  })
}

function renderInlineEditForm(
  comment: CommentData,
  onSubmit: (commentId: string, body: string) => void,
  onCancel: () => void,
  isSubmitting: boolean
): HTMLElement {
  return renderInlineForm({
    headerLabel: null,
    currentUser: null,
    initialValue: comment.body,
    placeholder: "Edit your comment…",
    ariaLabel: "Edit comment",
    maxChars: MAX_CHARS_EDIT,
    submitLabel: "Save",
    submittingLabel: "Saving…",
    isSubmitting,
    onSubmit: (body) => onSubmit(comment.id, body),
    onCancel,
  })
}

export function renderCommentList(
  comments: CommentData[],
  handlers: CommentHandlers,
  state: CommentState
): HTMLElement {
  if (comments.length === 0) {
    const el = document.createElement("div")
    el.className = "z-empty"

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    icon.setAttribute("viewBox", "0 0 24 24")
    icon.setAttribute("fill", "none")
    icon.setAttribute("stroke", "currentColor")
    icon.setAttribute("stroke-width", "1.5")
    icon.setAttribute("aria-hidden", "true")
    icon.classList.add("z-empty-icon")
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />`
    el.appendChild(icon)

    const title = document.createElement("p")
    title.className = "z-empty-title"
    title.textContent = "No comments yet"
    el.appendChild(title)

    const desc = document.createElement("p")
    desc.className = "z-empty-desc"
    desc.textContent = "Be the first to share your thoughts."
    el.appendChild(desc)

    return el
  }

  const list = document.createElement("ul")
  list.className = "z-list"
  list.setAttribute("aria-label", "Comments")
  for (const c of comments) {
    list.appendChild(renderCommentItem(c, 0, handlers, state))
  }
  return list
}

const BELL_ON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`
const BELL_OFF = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.9 17.9 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`

export function renderAuthBar(
  auth: AuthState,
  onSignIn: () => void,
  onSignOut: () => void,
  notificationsEnabled = true,
  onToggleNotifications?: () => void
): HTMLElement {
  const bar = document.createElement("div")
  bar.className = "z-auth-bar"

  if (auth.status === "authenticated") {
    bar.appendChild(avatarEl(auth.user.name, auth.user.image ?? null))
    const name = document.createElement("span")
    name.className = "z-user-name"
    name.textContent = auth.user.name
    bar.appendChild(name)

    if (onToggleNotifications) {
      const bellBtn = document.createElement("button")
      bellBtn.className =
        "z-btn z-btn-ghost z-btn-sm z-notif-btn" +
        (notificationsEnabled ? "" : " z-notif-btn-off")
      bellBtn.type = "button"
      bellBtn.innerHTML = notificationsEnabled ? BELL_ON : BELL_OFF
      bellBtn.title = notificationsEnabled
        ? "Mute email notifications"
        : "Unmute email notifications"
      bellBtn.setAttribute(
        "aria-label",
        notificationsEnabled
          ? "Mute email notifications"
          : "Unmute email notifications"
      )
      bellBtn.addEventListener("click", onToggleNotifications)
      bar.appendChild(bellBtn)
    }

    const signOutBtn = document.createElement("button")
    signOutBtn.className = "z-btn z-btn-ghost z-btn-sm"
    signOutBtn.textContent = "Sign out"
    signOutBtn.type = "button"
    signOutBtn.addEventListener("click", onSignOut)
    bar.appendChild(signOutBtn)
  } else {
    const label = document.createElement("span")
    label.className = "z-user-name"
    label.textContent = "Sign in to comment"
    bar.appendChild(label)

    const signInBtn = document.createElement("button")
    signInBtn.className = "z-btn z-btn-google"
    signInBtn.type = "button"
    signInBtn.disabled = auth.status === "loading"
    signInBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>${auth.status === "loading" ? "Signing in…" : "Continue with Google"}`
    signInBtn.addEventListener("click", onSignIn)
    bar.appendChild(signInBtn)
  }

  return bar
}

export function renderCommentForm(
  onSubmit: (body: string, parentId?: string) => Promise<void>,
  replyTo: CommentData | null,
  onCancelReply: () => void,
  isSubmitting: boolean
): HTMLElement {
  const form = document.createElement("div")
  form.className = "z-form"

  if (replyTo) {
    const indicator = document.createElement("div")
    indicator.className = "z-reply-indicator"
    indicator.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>Replying to <strong>${replyTo.commenter.name}</strong>`
    const cancelBtn = document.createElement("button")
    cancelBtn.type = "button"
    cancelBtn.className = "z-reply-indicator-cancel"
    cancelBtn.setAttribute("aria-label", "Cancel reply")
    cancelBtn.textContent = "✕"
    cancelBtn.addEventListener("click", onCancelReply)
    indicator.appendChild(cancelBtn)
    form.appendChild(indicator)
  }

  const textarea = document.createElement("textarea")
  textarea.placeholder = replyTo
    ? `Reply to ${replyTo.commenter.name}…`
    : "Write a comment…"
  textarea.setAttribute(
    "aria-label",
    replyTo ? `Reply to ${replyTo.commenter.name}` : "Write a comment"
  )
  textarea.rows = 3
  textarea.disabled = isSubmitting

  textarea.addEventListener("input", () => {
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
    const len = textarea.value.length
    counter.textContent = `${len} / ${MAX_CHARS_COMMENT}`
    counter.classList.toggle(
      "z-char-counter-warn",
      len >= MAX_CHARS_COMMENT * 0.9 && len < MAX_CHARS_COMMENT
    )
    counter.classList.toggle("z-char-counter-over", len > MAX_CHARS_COMMENT)
    submitBtn.disabled = isSubmitting || len === 0 || len > MAX_CHARS_COMMENT
  })

  form.appendChild(textarea)

  const footer = document.createElement("div")
  footer.className = "z-form-footer"

  const counter = document.createElement("span")
  counter.className = "z-char-counter"
  counter.setAttribute("aria-live", "polite")
  counter.textContent = `0 / ${MAX_CHARS_COMMENT}`
  footer.appendChild(counter)

  const submitBtn = document.createElement("button")
  submitBtn.className = "z-btn z-btn-primary"
  submitBtn.type = "button"
  submitBtn.textContent = isSubmitting
    ? "Posting…"
    : replyTo
      ? "Post reply"
      : "Post comment"
  submitBtn.disabled = isSubmitting || textarea.value.trim().length === 0
  submitBtn.addEventListener("click", async () => {
    const body = textarea.value.trim()
    if (!body || body.length > MAX_CHARS_COMMENT) {
      textarea.focus()
      return
    }
    await onSubmit(body, replyTo?.id)
    textarea.value = ""
    textarea.style.height = ""
    counter.textContent = `0 / ${MAX_CHARS_COMMENT}`
    counter.classList.remove("z-char-counter-warn", "z-char-counter-over")
    submitBtn.disabled = true
  })

  footer.appendChild(submitBtn)
  form.appendChild(footer)

  return form
}

export function renderError(message: string): HTMLElement {
  const el = document.createElement("div")
  el.className = "z-error"
  el.setAttribute("role", "alert")
  el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${message}`
  return el
}

export function renderBannedBanner(): HTMLElement {
  const banner = document.createElement("div")
  banner.className = "z-banned-banner"
  banner.setAttribute("role", "alert")
  banner.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>You're Banned`
  return banner
}

export function renderLoadingAuthBar(): HTMLElement {
  const bar = document.createElement("div")
  bar.className = "z-skeleton-authbar"
  bar.setAttribute("aria-hidden", "true")

  const avatar = document.createElement("div")
  avatar.className = "z-skeleton z-skeleton-avatar"
  bar.appendChild(avatar)

  const name = document.createElement("div")
  name.className = "z-skeleton z-skeleton-name"
  name.style.width = "90px"
  bar.appendChild(name)

  const spacer = document.createElement("div")
  spacer.className = "z-skeleton-spacer"
  bar.appendChild(spacer)

  const btn = document.createElement("div")
  btn.className = "z-skeleton z-skeleton-name"
  btn.style.width = "70px"
  btn.style.height = "28px"
  btn.style.borderRadius = "var(--z-radius-sm)"
  bar.appendChild(btn)

  return bar
}

export function renderLoading(): HTMLElement {
  const wrap = document.createElement("div")
  wrap.setAttribute("aria-busy", "true")
  wrap.setAttribute("aria-label", "Loading comments")

  const items: [string, string[]][] = [
    ["110px", ["88%", "64%"]],
    ["80px", ["92%", "76%", "48%"]],
    ["130px", ["70%", "84%"]],
  ]

  const list = document.createElement("ul")
  list.className = "z-loading"

  for (const [nameWidth, bodyLines] of items) {
    const item = document.createElement("li")
    item.className = "z-skeleton-item"

    const meta = document.createElement("div")
    meta.className = "z-skeleton-meta"
    meta.setAttribute("aria-hidden", "true")

    const avatar = document.createElement("div")
    avatar.className = "z-skeleton z-skeleton-avatar"
    meta.appendChild(avatar)

    const name = document.createElement("div")
    name.className = "z-skeleton z-skeleton-name"
    name.style.width = nameWidth
    meta.appendChild(name)

    const spacer = document.createElement("div")
    spacer.className = "z-skeleton-spacer"
    meta.appendChild(spacer)

    const time = document.createElement("div")
    time.className = "z-skeleton z-skeleton-time"
    meta.appendChild(time)

    item.appendChild(meta)

    for (const w of bodyLines) {
      const line = document.createElement("div")
      line.className = "z-skeleton z-skeleton-line"
      line.style.width = w
      item.appendChild(line)
    }

    list.appendChild(item)
  }

  wrap.appendChild(list)
  return wrap
}

// html comes from config.json (server-controlled, not user input) — safe to use innerHTML
export function renderFooter(html: string): HTMLElement {
  const footer = document.createElement("footer")
  footer.className = "z-footer"
  footer.innerHTML = html
  return footer
}
