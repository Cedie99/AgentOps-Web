import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createStorageBucket() {
  try {
    console.log('Creating storage bucket for survey photos...\n')

    // Create the bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('survey-photos', {
      public: false, // Private bucket - only authenticated users can access
      fileSizeLimit: 10485760, // 10MB limit
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png']
    })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✓ Bucket already exists')
      } else {
        throw bucketError
      }
    } else {
      console.log('✓ Created bucket:', bucket)
    }

    console.log('\n✅ Storage bucket setup complete!')
    console.log('\nBucket configuration:')
    console.log('- Name: survey-photos')
    console.log('- Public: false (authenticated access only)')
    console.log('- Max file size: 10MB')
    console.log('- Allowed types: JPEG, JPG, PNG')

  } catch (error) {
    console.error('Error creating storage bucket:', error)
    throw error
  }
}

createStorageBucket()
