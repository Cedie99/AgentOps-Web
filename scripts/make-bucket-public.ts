import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function makeBucketPublic() {
  try {
    console.log('Making survey-photos bucket public...\n')

    // Update the bucket to be public
    const { data, error } = await supabase.storage.updateBucket('survey-photos', {
      public: true
    })

    if (error) {
      throw error
    }

    console.log('✅ Bucket is now public!')
    console.log('\nBucket configuration:')
    console.log('- Name: survey-photos')
    console.log('- Public: true (no authentication required)')
    console.log('- Max file size: 10MB')
    console.log('- Allowed types: JPEG, JPG, PNG')
    console.log('\nPhotos can now be uploaded and accessed without RLS policies.')

  } catch (error) {
    console.error('Error making bucket public:', error)
    throw error
  }
}

makeBucketPublic()
