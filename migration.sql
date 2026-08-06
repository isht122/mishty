-- 1. CREATE ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) so public cannot read admin emails
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 2. INSERT DEFAULT ADMIN EMAILS
INSERT INTO public.admins (email) VALUES 
('nutansingh603@gmail.com'), 
('singhrenuka412@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 3. POLICIES FOR ADMINS TABLE
-- Only authenticated users (admins) can read admin emails
CREATE POLICY "Allow authenticated read admins" ON public.admins
    FOR SELECT TO authenticated USING (true);

-- 4. UPDATE SECURITY POLICIES ON INVENTORY, ORDERS, & INQUIRIES
-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin write products" ON public.products;
DROP POLICY IF EXISTS "Allow admin read/write orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin read/write inquiries" ON public.inquiries;

-- Re-create policies using the new public.admins database table lookup
CREATE POLICY "Allow admin write products" ON public.products 
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "Allow admin read/write orders" ON public.orders 
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "Allow admin read/write inquiries" ON public.inquiries 
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );
