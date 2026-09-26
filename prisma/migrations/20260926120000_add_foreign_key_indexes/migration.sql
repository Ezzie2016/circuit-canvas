-- CreateIndex
CREATE INDEX "Course_teacherId_idx" ON "Course"("teacherId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "Assignment_courseId_dueDate_idx" ON "Assignment"("courseId", "dueDate");

-- CreateIndex
CREATE INDEX "Submission_assignmentId_idx" ON "Submission"("assignmentId");

-- CreateIndex
CREATE INDEX "LiveSession_courseId_startsAt_idx" ON "LiveSession"("courseId", "startsAt");

-- CreateIndex
CREATE INDEX "LiveSession_startsAt_idx" ON "LiveSession"("startsAt");

-- CreateIndex
CREATE INDEX "CourseResource_courseId_idx" ON "CourseResource"("courseId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_courseId_status_idx" ON "AttendanceRecord"("courseId", "status");

-- CreateIndex
CREATE INDEX "AttendanceRecord_liveSessionId_idx" ON "AttendanceRecord"("liveSessionId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationRead_notificationId_idx" ON "NotificationRead"("notificationId");

-- CreateIndex
CREATE INDEX "CourseMessage_courseId_createdAt_idx" ON "CourseMessage"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "CourseMessage_senderId_idx" ON "CourseMessage"("senderId");

