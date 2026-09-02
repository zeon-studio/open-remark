import type {
  AuthState,
  CommentData,
  Commenter,
  WidgetConfig,
  WidgetThemeConfig,
} from "./types"
import {
  fetchComments,
  postComment,
  likeComment,
  updateComment,
  deleteComment,
  updateNotificationPreference,
  searchCommenters,
  UnauthorizedError,
} from "./api"
import { loadStoredAuth, signInWithGoogle, clearAuth } from "./auth"
import {
  renderAuthBar,
  renderCommentForm,
  renderCommentItem,
  renderCommentList,
  renderError,
  renderFooter,
  renderLoading,
  renderLoadingAuthBar,
  renderBannedBanner,
  type CommentHandlers,
  type CommentState,
} from "./render"

declare const __APP_URL__: string
declare const __GOOGLE_CLIENT_ID__: string
declare const __STYLES__: string

function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return "#ffffff"
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? "#0f172a" : "#ffffff"
}

function resolveEffectiveTheme(cfg: WidgetThemeConfig): "LIGHT" | "DARK" {
  if (cfg.theme === "LIGHT") return "LIGHT"
  if (cfg.theme === "DARK") return "DARK"
  if (document.documentElement.classList.contains("dark")) return "DARK"
  return "LIGHT"
}

function buildThemeStyle(cfg: WidgetThemeConfig): string {
  const lines: string[] = []
  const effective = resolveEffectiveTheme(cfg)

  if (effective === "DARK") {
    lines.push(`:host {
  --z-bg: #0f172a;
  --z-text: #f8fafc;
  --z-border: #1e293b;
  --z-muted: #94a3b8;
  --z-subtle: #1e293b;
  --z-accent: #1e293b;
  --z-skel-base: #1e293b;
  --z-skel-glow: #334155;
}`)
  } else {
    lines.push(`:host {
  --z-bg: #ffffff;
  --z-text: #0f172a;
  --z-border: #e2e8f0;
  --z-muted: #64748b;
  --z-subtle: #f1f5f9;
  --z-accent: #f1f5f9;
  --z-skel-base: #e8edf2;
  --z-skel-glow: #f8fafc;
}`)
  }

  lines.push(`:host {
  --z-primary: ${cfg.primaryColor};
  --z-primary-fg: ${readableOn(cfg.primaryColor)};
  --z-radius: ${cfg.radius}px;
}`)

  return lines.join("\n")
}

function themeKey(siteKey: string) {
  return `zeon_theme_${siteKey}`
}

function loadCachedTheme(siteKey: string): WidgetThemeConfig | null {
  try {
    const raw = localStorage.getItem(themeKey(siteKey))
    return raw ? (JSON.parse(raw) as WidgetThemeConfig) : null
  } catch {
    return null
  }
}

function saveCachedTheme(siteKey: string, cfg: WidgetThemeConfig) {
  try {
    localStorage.setItem(themeKey(siteKey), JSON.stringify(cfg))
  } catch {
    /* storage quota / private mode */
  }
}

class ZeonWidget {
  private config: WidgetConfig
  private shadow: ShadowRoot
  private root: HTMLElement
  private themeStyle: HTMLStyleElement
  private auth: AuthState
  private comments: CommentData[] = []
  private commentMap = new Map<string, CommentData>()
  private replyTo: CommentData | null = null
  private replyingToId: string | null = null
  private isEditingId: string | null = null
  private deletingId: string | null = null
  private isSubmitting = false
  private isBanned = false
  private actionError: string | null = null
  private actionErrorTimer: ReturnType<typeof setTimeout> | null = null
  private notificationsEnabled = true
  private likingIds = new Set<string>()
  private usernameMap = new Map<string, Commenter>()
  private mentionDropdown: HTMLElement | null = null
  private profileTooltip: HTMLElement | null = null
  private mentionTextarea: HTMLTextAreaElement | null = null
  private mentionQuery = ""
  private mentionResults: Commenter[] = []
  private mentionSelectedIndex = 0
  private mentionDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private activeConfig: WidgetThemeConfig | null = null
  private lastEffectiveTheme: "LIGHT" | "DARK" | null = null
  private htmlObserver: MutationObserver | null = null

  constructor(config: WidgetConfig) {
    this.config = config
    this.shadow = config.container.attachShadow({ mode: "open" })
    this.auth = loadStoredAuth()

    const style = document.createElement("style")
    style.textContent = __STYLES__
    this.shadow.appendChild(style)

    this.themeStyle = document.createElement("style")
    const cached = loadCachedTheme(config.siteKey)
    this.applyTheme(
      cached ?? {
        theme: "AUTO",
        primaryColor: "#0f172a",
        radius: 8,
        enable: true,
        poweredByHtml: "",
      }
    )
    this.shadow.appendChild(this.themeStyle)
    this.setupThemeObservers()

    this.root = document.createElement("div")
    this.root.className = "z-root"
    this.shadow.appendChild(this.root)

    this.shadow.addEventListener("click", (e) => {
      const dropdowns =
        this.root.querySelectorAll<HTMLElement>(".z-menu-dropdown")
      for (const d of dropdowns) {
        const wrap = d.closest(".z-comment-actions-wrap")
        if (wrap && !wrap.contains(e.target as Node)) {
          d.style.display = "none"
        }
      }
    })

    this.shadow.addEventListener("input", (e) => {
      if ((e.target as Element).tagName === "TEXTAREA") {
        this.handleMentionInput(e.target as HTMLTextAreaElement)
      }
    })

    this.shadow.addEventListener("keydown", (e) => {
      if ((e.target as Element).tagName === "TEXTAREA") {
        this.handleMentionKeydown(
          e.target as HTMLTextAreaElement,
          e as KeyboardEvent
        )
      }
    })

    this.shadow.addEventListener("focusout", (e) => {
      if ((e.target as Element).tagName === "TEXTAREA") {
        this.hideMentionDropdown()
      }
    })

    this.shadow.addEventListener("mouseover", (e) => {
      const span = (e.target as Element).closest("[data-username]")
      if (span instanceof HTMLElement) this.showProfileTooltip(span)
    })

    this.shadow.addEventListener("mouseout", (e: Event) => {
      const me = e as MouseEvent
      const span = (me.target as Element).closest("[data-username]")
      if (span && !span.contains(me.relatedTarget as Node)) {
        this.hideProfileTooltip()
      }
    })

    this.render()
    this.loadComments()
  }

  private get token(): string | undefined {
    return this.auth.status === "authenticated" ? this.auth.token : undefined
  }

  private get currentUser(): Commenter | null {
    if (this.auth.status !== "authenticated") return null
    return {
      id: this.auth.user.commenterId,
      name: this.auth.user.name,
      username: this.auth.user.email.split("@")[0] ?? "user",
      image: this.auth.user.image ?? null,
    }
  }

  private async loadComments() {
    this.renderLoadingState()
    try {
      const { comments, config: themeConfig } = await fetchComments(
        this.config.appUrl,
        this.config.siteKey,
        this.config.slug,
        this.token
      )
      this.applyTheme(themeConfig)
      saveCachedTheme(this.config.siteKey, themeConfig)
      this.isBanned = themeConfig.currentUser?.isBanned ?? false
      this.notificationsEnabled =
        themeConfig.currentUser?.notificationsEnabled ?? true
      this.comments = comments
      this.buildCommentMap()
      this.render()
      this.scrollToCommentFromHash()
    } catch (err) {
      if (
        err instanceof UnauthorizedError &&
        this.auth.status === "authenticated"
      ) {
        clearAuth()
        this.auth = { status: "idle" }
        await this.loadComments()
        return
      }
      this.renderErrorState("Failed to load comments. Please try again later.")
    }
  }

  private scrollToCommentFromHash() {
    const hash = window.location.hash
    if (!hash.startsWith("#comment-")) return
    const commentId = hash.slice("#comment-".length)
    const el = this.root.querySelector<HTMLElement>(`[data-id="${commentId}"]`)
    if (!el) return
    // Small delay lets the browser finish painting before scrolling
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.style.outline = `2px solid var(--z-primary)`
      el.style.outlineOffset = "4px"
      el.style.borderRadius = "var(--z-radius)"
      setTimeout(() => {
        el.style.outline = ""
        el.style.outlineOffset = ""
        el.style.borderRadius = ""
      }, 2000)
    }, 100)
  }

  private async handleSignIn() {
    this.auth = { status: "loading" }
    this.render()
    try {
      const googleClientId = __GOOGLE_CLIENT_ID__
      const { token, user } = await signInWithGoogle(
        this.config.appUrl,
        googleClientId
      )
      this.auth = { status: "authenticated", token, user }
      await this.loadComments()
      return
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed"
      this.auth = { status: "error", message }
      setTimeout(() => {
        this.auth = { status: "idle" }
        this.render()
      }, 3000)
    }
    this.render()
  }

  private handleSignOut() {
    clearAuth()
    this.auth = { status: "idle" }
    this.replyTo = null
    this.replyingToId = null
    this.isEditingId = null
    this.render()
  }

  private async handleToggleNotifications() {
    if (this.auth.status !== "authenticated") return
    const next = !this.notificationsEnabled
    this.notificationsEnabled = next
    this.render()
    try {
      await updateNotificationPreference(
        this.config.appUrl,
        this.auth.token,
        next
      )
    } catch (err) {
      this.notificationsEnabled = !next
      if (err instanceof UnauthorizedError) {
        this.handleSessionExpired()
        return
      }
      this.render()
    }
  }

  private async handleSubmit(body: string, parentId?: string) {
    if (this.auth.status !== "authenticated") return
    this.isSubmitting = true
    this.render()
    try {
      let finalBody = body
      let finalParentId = parentId
      let replyToId: string | undefined
      if (parentId) {
        const target = this.findComment(parentId)
        if (target && target.commenter) {
          const isNestedReply = this.findParentComment(parentId) !== null
          if (isNestedReply) {
            finalBody = `@${target.commenter.username} ${body}`
            replyToId = parentId
            finalParentId = target.parentId ?? parentId
          }
        }
      }

      const comment = await postComment(this.config.appUrl, this.auth.token, {
        body: finalBody,
        siteKey: this.config.siteKey,
        slug: this.config.slug,
        url: window.location.href.split("#")[0],
        parentId: finalParentId,
        replyToId,
      })

      if (finalParentId) {
        const parent = this.comments.find((c) => c.id === finalParentId)
        if (parent) {
          parent.replies = [...(parent.replies ?? []), comment]
        }
      } else {
        this.comments = [comment, ...this.comments]
      }
      this.buildCommentMap()
      this.replyTo = null
      this.replyingToId = null
      this.actionError = null
    } catch (err: unknown) {
      this.handleApiError(err, "Failed to post")
    } finally {
      this.isSubmitting = false
      this.render()
    }
  }

  private async handleLike(comment: CommentData) {
    if (this.auth.status !== "authenticated") {
      this.handleSignIn()
      return
    }
    this.likingIds.add(comment.id)
    this.patchComment(comment.id)
    try {
      const result = await likeComment(
        this.config.appUrl,
        this.auth.token,
        comment.id
      )
      comment.hasLiked = result.liked
      comment.likeCount = result.count
    } catch (err: unknown) {
      this.handleApiError(err, "Failed to update like")
    } finally {
      this.likingIds.delete(comment.id)
      this.patchComment(comment.id)
    }
  }

  private buildCommentMap() {
    this.commentMap.clear()
    this.usernameMap.clear()
    for (const c of this.comments) {
      this.commentMap.set(c.id, c)
      this.usernameMap.set(c.commenter.username, c.commenter)
      for (const r of c.replies ?? []) {
        this.commentMap.set(r.id, r)
        this.usernameMap.set(r.commenter.username, r.commenter)
      }
    }
  }

  private findComment(id: string): CommentData | null {
    return this.commentMap.get(id) ?? null
  }

  private findParentComment(replyId: string): CommentData | null {
    for (const c of this.comments) {
      if (c.replies?.some((r) => r.id === replyId)) return c
    }
    return null
  }

  private handleSessionExpired() {
    clearAuth()
    this.replyTo = null
    this.replyingToId = null
    this.isEditingId = null
    this.auth = {
      status: "error",
      message: "Your session expired. Please sign in again.",
    }
    this.render()
    setTimeout(() => {
      if (this.auth.status === "error") {
        this.auth = { status: "idle" }
        this.render()
      }
    }, 3000)
  }

  private handleApiError(err: unknown, fallback: string): void {
    if (err instanceof UnauthorizedError) {
      this.handleSessionExpired()
      return
    }
    const message = err instanceof Error ? err.message : fallback
    if (message.toLowerCase().includes("suspended")) {
      this.isBanned = true
      this.render()
      return
    }
    if (this.actionErrorTimer) clearTimeout(this.actionErrorTimer)
    this.actionError = message
    this.actionErrorTimer = setTimeout(() => {
      this.actionError = null
      this.render()
    }, 4000)
    this.render()
  }

  private handleReplyClick(comment: CommentData) {
    if (this.auth.status !== "authenticated") {
      this.handleSignIn()
      return
    }
    this.replyingToId = comment.id
    this.patchComment(comment.id)
  }

  private handleCancelReply() {
    const prev = this.replyingToId
    this.replyingToId = null
    if (prev) {
      this.patchComment(prev)
    } else {
      this.render()
    }
  }

  private handleEditClick(comment: CommentData) {
    if (this.auth.status !== "authenticated") return
    this.isEditingId = comment.id
    this.patchComment(comment.id)
  }

  private handleCancelEdit() {
    const prev = this.isEditingId
    this.isEditingId = null
    if (prev) {
      this.patchComment(prev)
    } else {
      this.render()
    }
  }

  private handleDeleteClick(comment: CommentData) {
    if (this.auth.status !== "authenticated") return
    this.deletingId = comment.id
    this.patchComment(comment.id)
  }

  private handleCancelDelete() {
    const prev = this.deletingId
    this.deletingId = null
    if (prev) {
      this.patchComment(prev)
    } else {
      this.render()
    }
  }

  private async handleConfirmDelete(commentId: string) {
    if (this.auth.status !== "authenticated") return
    this.isSubmitting = true
    this.render()
    try {
      const updated = await deleteComment(
        this.config.appUrl,
        this.auth.token,
        commentId
      )
      const target = this.findComment(commentId)
      if (target) {
        target.status = updated.status
        target.body = updated.body
      }
      this.deletingId = null
    } catch (err: unknown) {
      this.handleApiError(err, "Failed to delete")
    } finally {
      this.isSubmitting = false
      this.render()
    }
  }

  private async handleSubmitEdit(commentId: string, body: string) {
    if (this.auth.status !== "authenticated") return
    this.isSubmitting = true
    this.render()
    try {
      const updated = await updateComment(
        this.config.appUrl,
        this.auth.token,
        commentId,
        body
      )
      const target = this.findComment(commentId)
      if (target) {
        target.body = updated.body
        target.editedAt = updated.editedAt
      }
      this.isEditingId = null
    } catch (err: unknown) {
      this.handleApiError(err, "Failed to update")
    } finally {
      this.isSubmitting = false
      this.render()
    }
  }

  private renderLoadingState() {
    this.root.innerHTML = ""
    const header = document.createElement("div")
    header.className = "z-header"
    const titleSkel = document.createElement("div")
    titleSkel.className = "z-skeleton z-skeleton-name"
    titleSkel.style.width = "80px"
    titleSkel.style.height = "14px"
    titleSkel.setAttribute("aria-hidden", "true")
    header.appendChild(titleSkel)
    this.root.appendChild(header)
    this.root.appendChild(renderLoadingAuthBar())
    this.root.appendChild(renderLoading())
  }

  private renderErrorState(message: string) {
    this.root.innerHTML = ""
    this.root.appendChild(renderError(message))
  }

  private renderErrorBanner(message: string) {
    const existing = this.root.querySelector(".z-error")
    if (existing) existing.remove()
    const banner = renderError(message)
    this.root.insertBefore(banner, this.root.firstChild)
    setTimeout(() => banner.remove(), 4000)
  }

  private buildHeader(): HTMLElement {
    const header = document.createElement("div")
    header.className = "z-header"
    const heading = document.createElement("h2")
    const count = this.comments.length
    heading.textContent = `${count} Comment${count !== 1 ? "s" : ""}`
    header.appendChild(heading)
    return header
  }

  private buildHandlers(): CommentHandlers {
    return {
      onReply: (comment) => this.handleReplyClick(comment),
      onLike: (comment) => this.handleLike(comment),
      onEdit: (comment) => this.handleEditClick(comment),
      onCancelEdit: () => this.handleCancelEdit(),
      onSubmitEdit: (id, body) => this.handleSubmitEdit(id, body),
      onDelete: (comment) => this.handleDeleteClick(comment),
      onCancelDelete: () => this.handleCancelDelete(),
      onConfirmDelete: (id) => this.handleConfirmDelete(id),
      onSubmitReply: (body, parentId) => this.handleSubmit(body, parentId),
      onCancelReply: () => this.handleCancelReply(),
    }
  }

  private buildState(): CommentState {
    return {
      replyingToId: this.replyingToId,
      editingId: this.isEditingId,
      deletingId: this.deletingId,
      isSubmitting: this.isSubmitting,
      currentUser: this.currentUser,
      likingIds: this.likingIds,
    }
  }

  private patchComment(commentId: string) {
    const el = this.root.querySelector<HTMLElement>(`[data-id="${commentId}"]`)
    const comment = this.findComment(commentId)
    if (!el || !comment) {
      this.render()
      return
    }
    const depth = el.closest(".z-replies") !== null ? 1 : 0
    const updated = renderCommentItem(
      comment,
      depth,
      this.buildHandlers(),
      this.buildState()
    )
    el.replaceWith(updated)
  }

  private render() {
    this.hideMentionDropdown()
    this.root.innerHTML = ""
    this.root.appendChild(this.buildHeader())

    if (this.isBanned) {
      this.root.appendChild(renderBannedBanner())
    }

    if (this.auth.status === "error") {
      this.root.appendChild(renderError(this.auth.message))
    } else if (this.actionError) {
      this.root.appendChild(renderError(this.actionError))
    }

    this.root.appendChild(
      renderAuthBar(
        this.auth,
        () => this.handleSignIn(),
        () => this.handleSignOut(),
        this.notificationsEnabled,
        () => this.handleToggleNotifications()
      )
    )

    if (this.auth.status === "authenticated" && !this.isBanned) {
      this.root.appendChild(
        renderCommentForm(
          (body, parentId) => this.handleSubmit(body, parentId),
          this.replyTo,
          () => {
            this.replyTo = null
            this.render()
          },
          this.isSubmitting
        )
      )
    }

    this.root.appendChild(
      renderCommentList(this.comments, this.buildHandlers(), this.buildState())
    )

    if (this.activeConfig?.enable && this.activeConfig?.poweredByHtml) {
      this.root.appendChild(renderFooter(this.activeConfig.poweredByHtml))
    }
  }

  private applyTheme(cfg: WidgetThemeConfig) {
    this.activeConfig = cfg
    const effective = resolveEffectiveTheme(cfg)
    if (effective !== this.lastEffectiveTheme) {
      this.lastEffectiveTheme = effective
      this.config.onThemeChange?.(effective === "DARK" ? "dark" : "light")
    }
    this.themeStyle.textContent = buildThemeStyle(cfg)
  }

  private setupThemeObservers() {
    const reapply = () => {
      if (this.activeConfig && this.activeConfig.theme === "AUTO") {
        this.applyTheme(this.activeConfig)
      }
    }

    let rafId: number | null = null
    const debouncedReapply = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        reapply()
      })
    }

    this.htmlObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "class") {
          debouncedReapply()
          return
        }
      }
    })
    this.htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
  }

  destroy() {
    this.htmlObserver?.disconnect()
    this.root.innerHTML = ""
    this.mentionDropdown?.remove()
    this.profileTooltip?.remove()
  }

  // ─── Mention autocomplete ─────────────────────────────────────────────────

  private handleMentionInput(textarea: HTMLTextAreaElement) {
    const pos = textarea.selectionStart ?? 0
    const before = textarea.value.slice(0, pos)
    const match = before.match(/@([a-z0-9]*)$/)
    if (match) {
      this.triggerMentionSearch(textarea, match[1])
    } else {
      this.hideMentionDropdown()
    }
  }

  private handleMentionKeydown(
    textarea: HTMLTextAreaElement,
    e: KeyboardEvent
  ) {
    if (!this.mentionDropdown || this.mentionDropdown.style.display === "none")
      return
    if (this.mentionResults.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        this.mentionSelectedIndex =
          (this.mentionSelectedIndex + 1) % this.mentionResults.length
        this.updateMentionSelection()
        break
      case "ArrowUp":
        e.preventDefault()
        this.mentionSelectedIndex =
          (this.mentionSelectedIndex - 1 + this.mentionResults.length) %
          this.mentionResults.length
        this.updateMentionSelection()
        break
      case "Enter":
      case "Tab":
        e.preventDefault()
        this.selectMention(
          textarea,
          this.mentionResults[this.mentionSelectedIndex]
        )
        break
      case "Escape":
        this.hideMentionDropdown()
        break
    }
  }

  private triggerMentionSearch(textarea: HTMLTextAreaElement, query: string) {
    this.mentionTextarea = textarea
    this.mentionQuery = query

    if (this.mentionDebounceTimer) clearTimeout(this.mentionDebounceTimer)
    if (!query) {
      this.hideMentionDropdown()
      return
    }

    this.mentionDebounceTimer = setTimeout(async () => {
      try {
        const results = await searchCommenters(
          this.config.appUrl,
          this.config.siteKey,
          query
        )
        if (this.mentionQuery !== query) return
        this.mentionResults = results
        this.mentionSelectedIndex = 0
        this.renderMentionDropdown(textarea)
      } catch {
        // silently ignore
      }
    }, 180)
  }

  private renderMentionDropdown(textarea: HTMLTextAreaElement) {
    if (this.mentionResults.length === 0) {
      this.hideMentionDropdown()
      return
    }

    if (!this.mentionDropdown) {
      this.mentionDropdown = document.createElement("div")
      this.mentionDropdown.className = "z-mention-dropdown"
      this.shadow.appendChild(this.mentionDropdown)
    }

    this.mentionDropdown.innerHTML = ""
    this.mentionResults.forEach((commenter, i) => {
      const item = document.createElement("button")
      item.type = "button"
      item.className =
        "z-mention-item" +
        (i === this.mentionSelectedIndex ? " z-mention-item-active" : "")

      if (commenter.image) {
        const img = document.createElement("img")
        img.src = commenter.image
        img.alt = commenter.name
        img.className = "z-avatar z-avatar-sm"
        item.appendChild(img)
      } else {
        const pl = document.createElement("div")
        pl.className = "z-avatar-placeholder z-avatar-placeholder-sm"
        pl.textContent = commenter.name.slice(0, 2).toUpperCase()
        item.appendChild(pl)
      }

      const info = document.createElement("div")
      info.className = "z-mention-item-info"

      const name = document.createElement("span")
      name.className = "z-mention-item-name"
      name.textContent = commenter.name
      info.appendChild(name)

      const username = document.createElement("span")
      username.className = "z-mention-item-username"
      username.textContent = `@${commenter.username}`
      info.appendChild(username)

      item.appendChild(info)
      item.addEventListener("mousedown", (e) => {
        e.preventDefault() // keep textarea focused
        this.selectMention(textarea, commenter)
      })
      this.mentionDropdown!.appendChild(item)
    })

    // Position above the textarea
    const rect = textarea.getBoundingClientRect()
    this.mentionDropdown.style.display = "block"
    this.mentionDropdown.style.left = `${rect.left}px`
    this.mentionDropdown.style.width = `${rect.width}px`
    // bottom: distance from viewport bottom so dropdown grows upward
    this.mentionDropdown.style.bottom = `${window.innerHeight - rect.top + 4}px`
    this.mentionDropdown.style.top = "auto"
  }

  private updateMentionSelection() {
    if (!this.mentionDropdown) return
    this.mentionDropdown
      .querySelectorAll(".z-mention-item")
      .forEach((el, i) => {
        el.classList.toggle(
          "z-mention-item-active",
          i === this.mentionSelectedIndex
        )
      })
  }

  private selectMention(textarea: HTMLTextAreaElement, commenter: Commenter) {
    const pos = textarea.selectionStart ?? 0
    const before = textarea.value.slice(0, pos)
    const after = textarea.value.slice(pos)
    const newBefore = before.replace(/@[a-z0-9]*$/, `@${commenter.username} `)
    textarea.value = newBefore + after
    const newPos = newBefore.length
    textarea.setSelectionRange(newPos, newPos)
    textarea.dispatchEvent(new Event("input", { bubbles: true }))
    this.hideMentionDropdown()
  }

  private hideMentionDropdown() {
    if (this.mentionDebounceTimer) {
      clearTimeout(this.mentionDebounceTimer)
      this.mentionDebounceTimer = null
    }
    if (this.mentionDropdown) this.mentionDropdown.style.display = "none"
    this.mentionTextarea = null
    this.mentionQuery = ""
    this.mentionResults = []
  }

  // ─── Profile hover tooltip ────────────────────────────────────────────────

  private showProfileTooltip(span: HTMLElement) {
    const username = span.dataset.username
    if (!username) return
    const commenter = this.usernameMap.get(username)
    if (!commenter) return

    if (!this.profileTooltip) {
      this.profileTooltip = document.createElement("div")
      this.profileTooltip.className = "z-user-tooltip"
      this.shadow.appendChild(this.profileTooltip)
    }

    this.profileTooltip.innerHTML = ""

    if (commenter.image) {
      const img = document.createElement("img")
      img.src = commenter.image
      img.alt = commenter.name
      img.className = "z-avatar"
      this.profileTooltip.appendChild(img)
    } else {
      const pl = document.createElement("div")
      pl.className = "z-avatar-placeholder"
      pl.textContent = commenter.name.slice(0, 2).toUpperCase()
      this.profileTooltip.appendChild(pl)
    }

    const info = document.createElement("div")
    info.className = "z-tooltip-info"

    const nameEl = document.createElement("p")
    nameEl.className = "z-tooltip-name"
    nameEl.textContent = commenter.name
    info.appendChild(nameEl)

    const usernameEl = document.createElement("p")
    usernameEl.className = "z-tooltip-username"
    usernameEl.textContent = `@${commenter.username}`
    info.appendChild(usernameEl)

    this.profileTooltip.appendChild(info)

    const rect = span.getBoundingClientRect()
    this.profileTooltip.style.display = "flex"
    this.profileTooltip.style.left = `${rect.left}px`
    this.profileTooltip.style.bottom = `${window.innerHeight - rect.top + 6}px`
    this.profileTooltip.style.top = "auto"
  }

  private hideProfileTooltip() {
    if (this.profileTooltip) this.profileTooltip.style.display = "none"
  }
}

function detectAppUrl(): string {
  const script = document.currentScript as HTMLScriptElement | null
  if (script?.src) {
    const url = new URL(script.src)
    return `${url.protocol}//${url.host}`
  }
  return __APP_URL__
}

function mount(): ZeonWidget[] {
  const appUrl = detectAppUrl()
  const elements = document.querySelectorAll<HTMLElement>("[data-open-remark]")
  const instances: ZeonWidget[] = []

  for (const el of elements) {
    const siteKey = el.dataset.siteKey
    if (!siteKey) {
      console.warn("[Open Remark] Missing data-site-key", el)
      continue
    }
    const slug = el.dataset.slug || window.location.pathname

    let onThemeChange: ((theme: "light" | "dark") => void) | undefined
    const cbName = el.dataset.onThemeChange
    if (cbName) {
      const cb = (window as unknown as Record<string, unknown>)[cbName]
      if (typeof cb === "function") {
        onThemeChange = cb as (theme: "light" | "dark") => void
      }
    }

    instances.push(
      new ZeonWidget({ siteKey, slug, container: el, appUrl, onThemeChange })
    )
  }
  return instances
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount)
} else {
  mount()
}

;(window as unknown as Record<string, unknown>).ZeonComments = { mount }
