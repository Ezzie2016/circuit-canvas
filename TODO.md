# TODO

## 1. Understand current grading + assignment creation flows
- Inspect existing Prisma models for `Assignment` and `Submission`.
- Inspect APIs: `/api/assignments` and `/api/submissions`.
- Inspect UI: teacher assignment create + teacher grade + student assignment display.

## 2. DB schema changes (Prisma)
- Add `totalMarks: Int` to `Assignment`.
- Add `earnedMarks: Int?` to `Submission`.
- (Optionally keep `grade: String?` for display; ensure consistent usage.)

## 3. API updates
- Update `/api/assignments` POST to accept and persist `totalMarks`.
- Update `/api/assignments` GET so students/teachers receive `totalMarks`.
- Update `/api/submissions` PATCH (grading) to accept earned marks / validate `earnedMarks <= totalMarks`.
- Update `/api/submissions` GET to include grade display (e.g. `earned/total`).

## 4. UI updates
- Update teacher assignment create form to input `totalMarks`.
- Update teacher grading UI to enter earned marks (e.g. `8`) and show max=`totalMarks`.
- Update student assignment detail UI and notification display to show `earned/total` once graded.

## 5. Migrations + checks
- Run Prisma migration and regenerate client.
- Run `npm run lint` and `npm run typecheck`.
- Manual test: create assignment (total=10), submit, grade (earned=8), verify student sees `8/10`.

