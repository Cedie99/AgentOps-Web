import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testQuery() {
  try {
    console.log('Testing Supabase query...\n')

    // First sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'surveyor@agentops.com',
      password: 'admin123'
    })

    if (authError) {
      console.error('Auth error:', authError)
      return
    }

    console.log('✓ Signed in successfully')
    console.log('User ID:', authData.user.id)
    console.log('User email:', authData.user.email)

    // Now try to query users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', authData.user.email)
      .single()

    if (userError) {
      console.error('\n✗ Error querying users table:', userError)
    } else {
      console.log('\n✓ Successfully queried users table')
      console.log('User data:', user)
    }

  } catch (error) {
    console.error('Test error:', error)
  }
}

testQuery()
