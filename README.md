# AgentOps Admin - Next.js Full-Stack Application

A comprehensive field operations management system built with Next.js, Supabase, Prisma, and shadcn/ui. This application manages surveyors, sales teams, logistics, and audit operations with real-time tracking and data management.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Supabase** - PostgreSQL database and authentication
- **Prisma** - Type-safe database ORM
- **shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Recharts** - Data visualization

## Features

- **Dashboard** - Overview of all operations with key metrics
- **Store Operations** - Comprehensive store management and tracking
- **Live Map** - Real-time agent location tracking
- **Surveyor Hub** - Manage surveyor activities and assignments
- **Sales Hub** - Track sales visits and orders
- **Logistics Hub** - Delivery management and tracking
- **Audit Hub** - Audit trail and compliance tracking
- **Fleet Assignment** - Agent and vehicle assignment management
- **Fuel & Fleet** - Vehicle tracking and fuel consumption monitoring
- **Attendance** - Agent attendance tracking
- **Broadcasts** - Announcement and notification system
- **User Management** - Admin user management

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > Database
3. Copy your database connection string

### 3. Configure Environment Variables

Update the `.env` file with your Supabase credentials:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase API
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

You can find your Supabase credentials in:
- **Project URL & Keys**: Settings > API
- **Database URL**: Settings > Database > Connection string

### 4. Set Up the Database

Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
agentops-nextjs/
├── app/
│   ├── api/                    # API routes
│   ├── dashboard/             # Dashboard pages
│   └── layout.tsx             # Root layout
├── components/
│   ├── dashboard/             # Dashboard components
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── supabase/              # Supabase clients
│   ├── prisma.ts              # Prisma client
│   └── types.ts               # Type definitions
├── prisma/
│   └── schema.prisma          # Database schema
└── middleware.ts              # Auth middleware
```

## Database Schema

Main models:
- **User** - Admin users
- **Agent** - Field agents
- **Store** - Customer stores
- **Vehicle** - Fleet vehicles
- **TimelineEvent** - Store timeline
- **Attendance** - Agent attendance
- **FuelEntry** - Fuel tracking
- **Announcement** - Broadcasts

## API Routes

RESTful API endpoints in `/app/api/`:
- `/api/stores` - Store management
- `/api/agents` - Agent management
- `/api/vehicles` - Vehicle management
- `/api/announcements` - Announcements
- `/api/fuel-entries` - Fuel tracking
- `/api/users` - User management

## Development Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Database GUI
npx prisma studio

# Reset database
npx prisma migrate reset
```

## Deploy to Vercel

1. Push code to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

## License

MIT
