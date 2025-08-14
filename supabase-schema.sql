-- Supabase Database Schema for Canteen App
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token INTEGER NOT NULL,
    table_number VARCHAR(10),
    items JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED')),
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    eta_minutes INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 2,
    unit VARCHAR(20) DEFAULT 'pieces',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    level VARCHAR(10) DEFAULT 'INFO' CHECK (level IN ('INFO', 'WARN', 'ERROR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (you can modify these based on your needs)
CREATE POLICY "Allow public read access to orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to inventory" ON inventory
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to logs" ON logs
    FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update
CREATE POLICY "Allow authenticated users to insert orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update orders" ON orders
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to insert inventory" ON inventory
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update inventory" ON inventory
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to insert logs" ON logs
    FOR INSERT WITH CHECK (true);

-- Insert sample inventory data
INSERT INTO inventory (name, stock, min_stock, unit) VALUES
    ('Tomatoes', 12, 2, 'pieces'),
    ('Cheese', 4, 1, 'kg'),
    ('Tea Powder', 1, 1, 'kg'),
    ('Coffee Beans', 5, 2, 'kg'),
    ('Bread', 20, 5, 'pieces'),
    ('Milk', 8, 3, 'liters')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
