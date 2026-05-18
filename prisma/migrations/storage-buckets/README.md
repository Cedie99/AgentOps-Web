# Storage Buckets Migration

This migration sets up the necessary Supabase storage buckets for the AgentOps mobile and web applications.

## Buckets Created

### 1. sales-proofs
- **Purpose**: Store proof images for sales activities
- **Size Limit**: 50 MB (52428800 bytes)
- **Allowed Types**: image/jpeg, image/jpg, image/png
- **Public**: Yes
- **Used By**: Mobile app - Sales activity recording

### 2. survey-photos
- **Purpose**: Store photos of surveyed stores
- **Size Limit**: 10 MB (10485760 bytes)
- **Allowed Types**: image/jpeg, image/jpg, image/png
- **Public**: Yes
- **Used By**: Mobile app - Survey submission

### 3. store-visits
- **Purpose**: Store photos from store visits
- **Size Limit**: 50 MB (52428800 bytes)
- **Allowed Types**: image/jpeg, image/jpg, image/png
- **Public**: Yes
- **Used By**: Mobile app - Store visit recording

### 4. delivery-proofs
- **Purpose**: Store delivery proof photos
- **Size Limit**: 50 MB (52428800 bytes)
- **Allowed Types**: Any image type
- **Public**: Yes
- **Used By**: Mobile app - Delivery completion

### 5. product-images
- **Purpose**: Store product images
- **Size Limit**: Unlimited
- **Allowed Types**: Any
- **Public**: Yes
- **Used By**: Web dashboard - Product management

## Policies

Each bucket has the following RLS policies:
1. **INSERT**: Authenticated users can upload files
2. **SELECT**: Public can view files (for displaying images in app)
3. **UPDATE**: Authenticated users can update their own files (where applicable)

## Running the Migration

To apply this migration to a new Supabase instance:

```bash
psql -h <host> -U <user> -d <database> -f migration.sql
```

Or using the Supabase CLI:

```bash
supabase db push
```

## Mobile App Usage

The mobile app uses these buckets as follows:

### Sales Activity Proof Upload
```typescript
// File: oraclemobile/app/sales/record-activity.tsx
const { error } = await supabase.storage
  .from('sales-proofs')
  .upload(filePath, imageData);
```

### Survey Photo Upload
```typescript
// File: oraclemobile/app/survey/add.tsx
const { data } = supabase.storage
  .from('survey-photos')
  .getPublicUrl(fileName);
```

### Store Visit Photo Upload
```typescript
// File: oraclemobile/app/sales/record-visit.tsx
const { data } = supabase.storage
  .from('store-visits')
  .getPublicUrl(fileName);
```

## Troubleshooting

### Error: "new row violates row-level security policy"
- Ensure the user is authenticated
- Check that the RLS policies are created correctly
- Verify the bucket_id in the upload request matches the bucket name

### Error: "Bucket not found"
- Run this migration to create the buckets
- Verify buckets exist: `SELECT * FROM storage.buckets;`

### Error: "File size exceeds limit"
- Check the file_size_limit for the bucket
- Compress images before upload if needed
