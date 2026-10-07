# Manpower Management V2

Mobile-first manpower replacement + skill monitoring with Supabase.

## 1. Supabase
Run `supabase/schema.sql` in Supabase SQL Editor. Then create at least one Authentication user.

## 2. Configure
Edit `config.js` with the Supabase Project URL and anon/publishable key. Never put the service-role key in frontend code.

## 3. Demo
If the Supabase values are empty, the UI runs with synthetic demo data only. No real employee data is included.

## 4. Vercel
Static deployment: repository root, no build command required. For production, configure Supabase and authentication first.

## 5. Privacy
Do not commit real names, REG codes, photos, or operational records. Use Supabase + RLS for the real dataset.
