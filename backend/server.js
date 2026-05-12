import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Support System API is running' });
});

// Import Routes
import retailerRoutes from './routes/retailers.js';
import brandRoutes from './routes/brands.js';
import salesRoutes from './routes/sales.js';
import reportRoutes from './routes/reports.js';

app.use('/api/retailers', retailerRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
