-- CreateIndex
CREATE INDEX "Comment_pageId_parentId_status_createdAt_idx" ON "Comment"("pageId", "parentId", "status", "createdAt");
