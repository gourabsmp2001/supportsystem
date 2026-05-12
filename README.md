# Support System

Support System is a Vercel-ready liquor sales reporting dashboard for retail visits, brand-wise sales, availability, schemes, stock, market share, spot promotion sales, photos, and PJP planning.

## Free Hosting Architecture

- Frontend: React + Vite + Tailwind CSS
- Hosting: Vercel free plan
- Database: Supabase PostgreSQL free plan
- Auth: Supabase Auth
- Storage: Supabase Storage bucket named `retail-visit-photos`
- Excel export: browser-side `.xlsx` files using ExcelJS
- Master data import: browser-side Excel/CSV parsing with `xlsx`

No Express backend is required for app usage.

## Local Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor and run [database/schema.sql](database/schema.sql).
3. In Supabase Authentication, create an admin user with email and password.
4. Copy [frontend/.env.example](frontend/.env.example) to `frontend/.env`.
5. Add:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

6. Install and run:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Supabase Tables

Run the schema to create:

- `users`
- `retailers`
- `brands`
- `brand_mrp`
- `sss_sales_entries`
- `availability_entries`
- `scheme_projections`
- `opening_stock_entries`
- `secondary_market_share_entries`
- `spot_promotion_entries`
- `retail_visit_entries`
- `pjp_entries`

The schema also enables RLS and creates policies for authenticated CRUD access.

## Supabase Storage

The schema creates a public bucket named `retail-visit-photos` and policies for authenticated uploads, updates, and deletes. Retail visit photos are uploaded from the browser and the public URL is saved in `retail_visit_entries.photo_url`.

## Import Data

Use the `Import Data` page after login to import:

- Retail List
- Brand List
- Brand MRP

Choose an `.xlsx`, `.xls`, or `.csv` file. The file is parsed in the browser only and is not uploaded to Supabase. The page shows a preview, inserted count, duplicate count, and invalid count before final import.

Duplicate handling:

- Retail List: skips rows where `retail_name` already exists, ignoring case and extra spaces.
- Brand List: skips rows where `brand_name` already exists, ignoring case and extra spaces.
- Brand MRP: skips rows where `brand_name + bottle_size + effective_month` already exists, ignoring case and extra spaces.

## Vercel Deployment

1. Push this project to GitHub.
2. Import the repo in Vercel.
3. Set the root directory to `frontend`.
4. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Build command: `npm run build`
6. Output directory: `dist`
7. Deploy.

## Testing Checklist

- Login with the Supabase Auth admin user.
- Open each module from the sidebar.
- Save a new record.
- Search for the record.
- Filter by month where the page supports month filtering.
- Edit the record and confirm table refresh.
- Delete a test record.
- Upload a retail visit photo and open the saved photo link.
- Download Excel from every report page.
- Test on mobile width using browser dev tools.

## Modules

- Retail List
- Brand List
- Brand MRP
- SSS Report / SS Report
- Availability Report
- Scheme Projection
- Brand Opening Stock
- Secondary Market Share
- Spot Promotion Sale
- Retail Visit with Photos
- PJP / Planned Journey Plan
