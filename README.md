# Circuit Canvas

A full-stack Learning Management System (LMS) built with Next.js 16, TypeScript, and PostgreSQL. Circuit Canvas supports three roles — Student, Teacher, and Admin — each with their own dedicated dashboard and features.

## Features

**Students**
- View enrolled courses and learning materials
- Submit and track assignments
- View grades and feedback
- Join live sessions
- Track attendance history and progress

**Teachers**
- Create and manage courses
- Create assignments and grade submissions
- Schedule and host live sessions
- Track student attendance and class performance
- Message students within courses

**Admins**
- Manage all users (students and teachers)
- View platform-wide analytics and reports
- Monitor activity logs
- Manage courses and settings

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **ORM:** Prisma 7
- **Database:** PostgreSQL (Supabase)
- **Auth:** Custom JWT with HTTP-only cookies

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (e.g. [Supabase](https://supabase.com))

### Installation

1. Clone the repo:
```bash
   git clone https://github.com/Ezzie2016/circuit-canvas.git
   cd circuit-canvas
```

2. Install dependencies:
```bash
   npm install
```

3. Create a `.env.local` file in the root:
```env
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
```

4. Generate the Prisma client:
```bash
   npx prisma generate
```

5. Run the development server:
```bash
   npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is deployed on [Vercel](https://vercel.com). To deploy your own:

1. Push the repo to GitHub
2. Import it on Vercel
3. Add the following environment variables in Vercel project settings:
   - `DATABASE_URL` — your PostgreSQL connection string
   - `JWT_SECRET` — a long random secret
4. Vercel will automatically run `prisma generate && next build` on each push

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |

## Project Structureutm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
