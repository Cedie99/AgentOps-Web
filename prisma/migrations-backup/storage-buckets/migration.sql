-- Storage Buckets Setup for AgentOps Mobile App
-- This migration creates the necessary Supabase storage buckets for image uploads

-- Create sales-proofs bucket for sales activity proof images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('sales-proofs', 'sales-proofs', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Create survey-photos bucket for survey store photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('survey-photos', 'survey-photos', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Create store-visits bucket for store visit photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('store-visits', 'store-visits', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Create delivery-proofs bucket for delivery proof photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('delivery-proofs', 'delivery-proofs', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Create product-images bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sales-proofs bucket
CREATE POLICY "Allow authenticated users to upload sales proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'sales-proofs');

CREATE POLICY "Allow public to view sales proofs"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'sales-proofs');

CREATE POLICY "Allow users to update their own sales proofs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'sales-proofs');

-- Storage policies for survey-photos bucket
CREATE POLICY "Allow authenticated users to upload survey photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'survey-photos');

CREATE POLICY "Allow public to view survey photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'survey-photos');

-- Storage policies for store-visits bucket
CREATE POLICY "Allow authenticated users to upload store visit photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'store-visits');

CREATE POLICY "Allow public to view store visit photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'store-visits');

-- Storage policies for delivery-proofs bucket
CREATE POLICY "Allow authenticated users to upload delivery proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'delivery-proofs');

CREATE POLICY "Allow public to view delivery proofs"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'delivery-proofs');

-- Storage policies for product-images bucket
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public to view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');
