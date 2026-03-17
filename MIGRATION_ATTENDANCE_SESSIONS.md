# Attendance Session Migration Guide

## Overview
This migration adds support for multiple clock-in/clock-out sessions per day, allowing users to clock in and out unlimited times. The system will automatically calculate total hours worked.

## Database Changes

### New Tables

#### 1. `attendance_sessions`
Stores individual clock-in/clock-out sessions throughout the day.

```sql
CREATE TABLE attendance_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date VARCHAR NOT NULL,
  clock_in_time TIMESTAMP NOT NULL,
  clock_out_time TIMESTAMP,
  clock_in_lat FLOAT,
  clock_in_long FLOAT,
  clock_out_lat FLOAT,
  clock_out_long FLOAT,
  duration_minutes INTEGER,
  auto_clocked_out BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_attendance_sessions_user_id ON attendance_sessions(user_id);
CREATE INDEX idx_attendance_sessions_work_date ON attendance_sessions(work_date);
CREATE INDEX idx_attendance_sessions_work_date_user_id ON attendance_sessions(work_date, user_id);
CREATE INDEX idx_attendance_sessions_clock_out_time ON attendance_sessions(clock_out_time);
```

#### 2. `attendance_summary`
Stores daily summary of total hours and sessions.

```sql
CREATE TABLE attendance_summary (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date VARCHAR NOT NULL,
  total_hours DECIMAL(5, 2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  first_clock_in TIMESTAMP NOT NULL,
  last_clock_out TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, work_date)
);

CREATE INDEX idx_attendance_summary_user_id ON attendance_summary(user_id);
CREATE INDEX idx_attendance_summary_work_date ON attendance_summary(work_date);
```

#### 3. `gps_tracking_session_points`
GPS tracking points linked to specific sessions.

```sql
CREATE TABLE gps_tracking_session_points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  session_id INTEGER REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  accuracy FLOAT,
  timestamp TIMESTAMP DEFAULT now(),
  speed FLOAT,
  heading FLOAT,
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_gps_session_points_user_id ON gps_tracking_session_points(user_id);
CREATE INDEX idx_gps_session_points_session_id ON gps_tracking_session_points(session_id);
CREATE INDEX idx_gps_session_points_timestamp ON gps_tracking_session_points(timestamp);
```

## Migration Steps

### 1. Run Prisma Migration

```bash
cd /Users/johnbalagtas/Desktop/Oracle/agentops-nextjs
npx prisma migrate dev --name add_attendance_sessions
npx prisma generate
```

### 2. Data Migration (Optional)

If you want to migrate existing attendance data to the new system:

```sql
-- Migrate existing attendance records to attendance_sessions
INSERT INTO attendance_sessions (
  user_id, work_date, clock_in_time, clock_out_time,
  clock_in_lat, clock_in_long, clock_out_lat, clock_out_long,
  auto_clocked_out, created_at, updated_at
)
SELECT
  user_id, work_date, clock_in_time, clock_out_time,
  clock_in_lat, clock_in_long, clock_out_lat, clock_out_long,
  auto_clocked_out, created_at, updated_at
FROM attendance
WHERE clock_out_time IS NOT NULL;

-- Create attendance summaries from migrated sessions
INSERT INTO attendance_summary (
  user_id, work_date, first_clock_in, last_clock_out,
  total_sessions, total_hours, created_at, updated_at
)
SELECT
  user_id,
  work_date,
  MIN(clock_in_time) as first_clock_in,
  MAX(clock_out_time) as last_clock_out,
  COUNT(*) as total_sessions,
  ROUND(SUM(EXTRACT(EPOCH FROM (clock_out_time - clock_in_time)) / 3600)::numeric, 2) as total_hours,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM attendance_sessions
WHERE clock_out_time IS NOT NULL
GROUP BY user_id, work_date;
```

### 3. Update the Old Table (Keep for backward compatibility)

The old `attendance` table is kept for backward compatibility. You can either:
- Keep both systems running in parallel
- Deprecate the old table after testing
- Remove it completely after migration

## Mobile App Changes

The mobile app has been updated to:
1. Use `attendance_sessions` table for clock-in/out
2. Calculate total hours from all sessions
3. Display session history
4. Show total hours worked for the day
5. Support unlimited clock-in/out throughout the day

## Web Dashboard Updates Needed

You'll need to update the web dashboard to:

1. **Display Session History**
   - Show all clock-in/out sessions for a day
   - Display duration for each session

2. **Show Total Hours**
   - Use `attendance_summary` table
   - Display total hours in decimal format (e.g., 8.50 hours)

3. **Reports**
   - Update reports to use session data
   - Calculate payroll based on total hours

4. **Admin Features**
   - View/edit individual sessions
   - Manually add/remove sessions
   - Adjust total hours if needed

## Example Queries

### Get all sessions for a user on a specific date:
```typescript
const sessions = await prisma.attendanceSession.findMany({
  where: {
    user_id: userId,
    work_date: '2026-03-17'
  },
  orderBy: {
    clock_in_time: 'asc'
  }
});
```

### Get daily summary:
```typescript
const summary = await prisma.attendanceSummary.findUnique({
  where: {
    user_id_work_date: {
      user_id: userId,
      work_date: '2026-03-17'
    }
  },
  include: {
    user: true
  }
});
```

### Calculate hours for incomplete session:
```typescript
const currentSession = await prisma.attendanceSession.findFirst({
  where: {
    user_id: userId,
    clock_out_time: null
  },
  orderBy: {
    clock_in_time: 'desc'
  }
});

if (currentSession) {
  const now = new Date();
  const durationMs = now.getTime() - currentSession.clock_in_time.getTime();
  const hours = durationMs / (1000 * 60 * 60);
  console.log(`Currently working: ${hours.toFixed(2)} hours`);
}
```

## Rollback Plan

If issues occur, you can rollback by:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

And continue using the old `attendance` table.

## Testing Checklist

- [ ] Clock in multiple times in a day
- [ ] Clock out from each session
- [ ] Verify total hours calculation
- [ ] Test auto clock-out at 5:30 PM
- [ ] Check GPS tracking for each session
- [ ] Verify attendance summary updates correctly
- [ ] Test offline mode with multiple sessions
- [ ] Verify data sync when back online
