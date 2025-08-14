# Supabase Setup Guide for Canteen App

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `canteen-app` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
6. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Update Configuration

1. Open `assets/js/supabase-config.js`
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

## Step 5: Test the Connection

1. Open your web app in a browser
2. Open the browser's Developer Tools (F12)
3. Go to the Console tab
4. You should see no errors related to Supabase
5. The app should now be connected to your Supabase database

## Database Tables Created

### Orders Table
- `id`: Unique identifier (UUID)
- `token`: Order number
- `table_number`: Table identifier
- `items`: JSON array of ordered items
- `status`: Order status (NEW, IN_PROGRESS, READY, DELIVERED, CANCELLED)
- `placed_at`: When order was placed
- `started_at`: When order preparation started
- `delivered_at`: When order was delivered
- `eta_minutes`: Estimated time to complete

### Inventory Table
- `id`: Unique identifier (UUID)
- `name`: Item name
- `stock`: Current stock quantity
- `min_stock`: Minimum stock threshold
- `unit`: Unit of measurement

### Logs Table
- `id`: Unique identifier (UUID)
- `message`: Log message
- `level`: Log level (INFO, WARN, ERROR)
- `created_at`: When log was created

## Features Added

✅ **Real-time Updates**: Orders and inventory changes update in real-time
✅ **Data Persistence**: All data is stored in Supabase database
✅ **Error Handling**: Comprehensive error handling for database operations
✅ **Security**: Row Level Security (RLS) enabled
✅ **Performance**: Database indexes for optimal query performance

## Next Steps

1. **Customize Security Policies**: Modify RLS policies based on your authentication needs
2. **Add Authentication**: Implement user authentication if needed
3. **Add More Features**: Extend the app with additional functionality
4. **Deploy**: Deploy your app to a hosting service

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your Supabase project allows requests from your domain
2. **Authentication Errors**: Check that your API keys are correct
3. **Database Errors**: Verify that the schema was created successfully

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- Check the browser console for detailed error messages
