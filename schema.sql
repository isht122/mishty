-- Supabase SQL Schema Setup Script
-- Copy and run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/yxxmbytgmvkioswmfeje/sql)

-- 1. CREATE ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Insert default admin emails
INSERT INTO public.admins (email) VALUES 
('nutansingh603@gmail.com'), 
('singhrenuka412@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Policy for admins table (only logged-in users can verify emails)
CREATE POLICY "Allow authenticated read admins" ON public.admins
    FOR SELECT TO authenticated USING (true);


-- 2. CREATE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    stock INTEGER DEFAULT 0 NOT NULL,
    image TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    is_available BOOLEAN DEFAULT true NOT NULL,
    tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies for Products
CREATE POLICY "Allow public read products" ON public.products 
    FOR SELECT USING (true);

CREATE POLICY "Allow admin write products" ON public.products 
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );


-- 3. CREATE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    ordered_sarees TEXT NOT NULL, -- comma-separated names/SKUs or JSON description
    quantity INTEGER DEFAULT 1 NOT NULL,
    total_price TEXT NOT NULL,
    payment_status TEXT DEFAULT 'Pending' NOT NULL,
    order_status TEXT DEFAULT 'Pending' NOT NULL, -- Pending, Confirmed, Shipped, Delivered, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies for Orders
CREATE POLICY "Allow public insert orders" ON public.orders 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin read/write orders" ON public.orders 
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );


-- 4. CREATE INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    saree_interested_in TEXT,
    message TEXT NOT NULL,
    is_responded BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Policies for Inquiries
CREATE POLICY "Allow public insert inquiries" ON public.inquiries 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin read/write inquiries" ON public.inquiries 
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );


-- 5. CREATE STORAGE BUCKET FOR SAREE IMAGES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('saree-images', 'saree-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Security Policies
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'saree-images');

CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'saree-images');

CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'saree-images');

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'saree-images');
