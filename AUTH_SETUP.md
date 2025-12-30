# Authentication Setup Guide

## Current Status

The database has been seeded with user records, but Supabase Auth users need to be created separately.

## Database Users (Already Created)

| ID | Email | Role | Web Access |
|----|-------|------|------------|
| 1 | admin@agentops.com | SUPER_ADMIN | ✅ Yes |
| 2 | manager@agentops.com | ADMIN | ✅ Yes |
| 3 | user@agentops.com | MANAGER | ❌ No (Mobile only) |

## Option 1: Manual Setup via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/wwmufvcqkpuplsrxpxvo

2. Navigate to **Authentication** → **Users**

3. Click **"Add User"** and create the following accounts:

   **Super Admin:**
   - Email: `admin@agentops.com`
   - Password: `admin123` (or your choice)
   - Auto Confirm User: ✅ Yes

   **Admin:**
   - Email: `manager@agentops.com`
   - Password: `admin123` (or your choice)
   - Auto Confirm User: ✅ Yes

4. Done! You can now login at http://localhost:3000/login

## Option 2: Automated Script (Requires Service Role Key)

1. Get your **service_role** key from Supabase:
   - Go to: https://supabase.com/dashboard/project/wwmufvcqkpuplsrxpxvo/settings/api
   - Copy the **service_role** key (long JWT token starting with `eyJ...`)

2. Update `.env` file:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY="paste_your_actual_service_role_key_here"
   ```

3. Run the script:
   ```bash
   tsx scripts/create-auth-users.ts
   ```

## Test Login

Once auth users are created, test the login:

**URL:** http://localhost:3000/login

**Credentials:**
- Super Admin: `admin@agentops.com` / `admin123`
- Admin: `manager@agentops.com` / `admin123`

## Troubleshooting

### "Invalid login credentials"
- Make sure you created the Supabase Auth users (Option 1 or 2)
- Check that the email and password match what you set

### "This endpoint requires a valid Bearer token"
- Your `SUPABASE_SERVICE_ROLE_KEY` in `.env` is incorrect
- Follow Option 1 (Manual Setup) instead

### Database records exist but can't login
- Database records and Supabase Auth are separate systems
- You need to create both the database record AND the auth user
- The seeder creates database records automatically
- Auth users must be created via Option 1 or 2
