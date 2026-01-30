# 🔐 Supabase Credentials

**⚠️ QUAN TRỌNG: File này chứa thông tin nhạy cảm. KHÔNG commit vào Git!**

## Project Information

- **Project URL**: `https://dkwaexdmbwyozzomdkoj.supabase.co`
- **Anon Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrd2FleGRtYnd5b3p6b21ka29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDIyNzAsImV4cCI6MjA4NTMxODI3MH0.nITw1YRtHCzDLOCq_g6I7HqVU2YVJqTABE8WjxHtEKE`
- **Database Password**: `cs#&XF5*JuW_x5/`

## Environment Variables cho Vercel

Set các biến sau trên Vercel Dashboard → Settings → Environment Variables:

```
SUPABASE_URL=https://dkwaexdmbwyozzomdkoj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrd2FleGRtYnd5b3p6b21ka29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDIyNzAsImV4cCI6MjA4NTMxODI3MH0.nITw1YRtHCzDLOCq_g6I7HqVU2YVJqTABE8WjxHtEKE
```

## Local Development (.env.local)

Tạo file `.env.local` (đã được ignore bởi .gitignore):

```
SUPABASE_URL=https://dkwaexdmbwyozzomdkoj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrd2FleGRtYnd5b3p6b21ka29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDIyNzAsImV4cCI6MjA4NTMxODI3MH0.nITw1YRtHCzDLOCq_g6I7HqVU2YVJqTABE8WjxHtEKE
```

## Database Connection (cho SQL Editor)

- **Host**: `db.dkwaexdmbwyozzomdkoj.supabase.co`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `cs#&XF5*JuW_x5/`
- **Port**: `5432`

## Next Steps

1. ✅ Credentials đã được lưu
2. ⏳ Tạo table metadata (chạy SQL trong SUPABASE_SETUP.md)
3. ⏳ Set env vars trên Vercel
4. ⏳ Redeploy project
