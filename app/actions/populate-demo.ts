'use server';

import { createClient } from '@supabase/supabase-js';

// Get service role client for admin operations
const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

// Test user emails
const TEST_USER_EMAILS = [
  'alice.demo@example.com',
  'bob.demo@example.com',
  'carol.demo@example.com',
  'diana.demo@example.com',
  'evan.demo@example.com',
];

async function clearOldDemoData() {
  if (!adminClient) return;
  
  try {
    console.log('🧹 Clearing old demo data...\n');
    
    // Get all test users
    const { data: allUsers, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw listError;
    
    const testUsers = allUsers.users
      .filter((u: any) => TEST_USER_EMAILS.includes(u.email))
      .map((u: any) => u.id);
    
    if (testUsers.length === 0) {
      console.log('✅ No old demo data found\n');
      return;
    }
    
    // Delete habits and logs for test users
    if (testUsers.length > 0) {
      const { error: habitsError } = await adminClient
        .from('habits')
        .delete()
        .in('user_id', testUsers);
      
      if (habitsError) {
        console.log(`⚠️ Warning clearing habits: ${habitsError.message}`);
      } else {
        console.log('✅ Cleared old habits');
      }
    }
    
    // Delete test users from auth
    for (const userId of testUsers) {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.log(`⚠️ Warning deleting user ${userId}: ${deleteError.message}`);
      }
    }
    
    console.log('✅ Old demo data cleared\n');
  } catch (error) {
    console.log(`⚠️ Could not clear old data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function populateDemoData() {
  if (!adminClient) {
    return {
      success: false,
      message: 'Service role key not configured',
    };
  }

  try {
    // Clear old demo data first
    await clearOldDemoData();
    
    console.log('🚀 Starting fresh demo data population...\n');

    const testUsers = [
      {
        email: 'alice.demo@example.com',
        password: 'Demo@123456',
        fullName: 'Alice Johnson',
        bio: 'Yoga instructor and wellness enthusiast from NYC',
      },
      {
        email: 'bob.demo@example.com',
        password: 'Demo@123456',
        fullName: 'Bob Smith',
        bio: 'Fitness trainer and marathon runner from LA',
      },
      {
        email: 'carol.demo@example.com',
        password: 'Demo@123456',
        fullName: 'Carol Davis',
        bio: 'Software engineer and meditation practitioner from SF',
      },
      {
        email: 'diana.demo@example.com',
        password: 'Demo@123456',
        fullName: 'Diana Wilson',
        bio: 'Artist and creative writer from Austin',
      },
      {
        email: 'evan.demo@example.com',
        password: 'Demo@123456',
        fullName: 'Evan Martinez',
        bio: 'Chef and culinary enthusiast from Miami',
      },
    ];

    // User-specific habit assignments for variety
    const userHabitMap: Record<string, string[]> = {
      'alice.demo@example.com': ['Morning Yoga', 'Meditation', 'Reading'],
      'bob.demo@example.com': ['Running', 'Gym Workout', 'Walking'],
      'carol.demo@example.com': ['Learning', 'Meditation', 'Journaling'],
      'diana.demo@example.com': ['Sketching', 'Reading', 'Journaling'],
      'evan.demo@example.com': ['Cooking Healthy Meal', 'Running', 'Learning'],
    };

    const habitTemplates = [
      { name: 'Morning Yoga', color: '#8B5CF6', description: 'Daily yoga practice for flexibility and peace' },
      { name: 'Running', color: '#EF4444', description: '5km daily run for cardio health' },
      { name: 'Meditation', color: '#EC4899', description: 'Mindfulness meditation session' },
      { name: 'Reading', color: '#3B82F6', description: '30 minutes of reading time' },
      { name: 'Gym Workout', color: '#F59E0B', description: 'Strength training and fitness' },
      { name: 'Cooking Healthy Meal', color: '#10B981', description: 'Prepare nutritious meals' },
      { name: 'Learning', color: '#06B6D4', description: 'Online learning and skill development' },
      { name: 'Journaling', color: '#8B5CF6', description: 'Daily journal writing' },
      { name: 'Sketching', color: '#F97316', description: 'Art and drawing practice' },
      { name: 'Walking', color: '#6366F1', description: 'Evening walk for wellness' },
    ];

    let createdUsers = 0;
    let createdHabits = 0;
    let createdLogs = 0;

    // Get existing users
    const { data: allUsers, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUserEmails = new Set(allUsers.users.map((u: any) => u.email));

    // Create test users
    for (const testUser of testUsers) {
      let userId: string;

      if (existingUserEmails.has(testUser.email)) {
        console.log(`✅ User ${testUser.email} already exists`);
        const user = allUsers.users.find((u: any) => u.email === testUser.email);
        userId = user?.id || '';
      } else {
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
        });

        if (createError || !newUser.user) {
          console.log(`❌ Failed to create user ${testUser.email}: ${createError?.message}`);
          continue;
        }

        userId = newUser.user.id;
        console.log(`✅ Created user ${testUser.email}`);
        createdUsers++;
      }

      // Create user profile
      const { error: profileError } = await adminClient
        .from('users')
        .upsert({
          id: userId,
          email: testUser.email,
          full_name: testUser.fullName,
          bio: testUser.bio,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.log(`   ⚠️ Could not update profile: ${profileError.message}`);
      } else {
        console.log(`   📝 Profile created for ${testUser.fullName}`);
      }

      // Assign specific habits to each user for better variety
      const assignedHabits = habitTemplates.filter(
        (h) => userHabitMap[testUser.email]?.includes(h.name)
      );

      // Create habits and completion logs
      for (const habitTemplate of assignedHabits) {
        const { data: habit, error: habitError } = await adminClient
          .from('habits')
          .insert([
            {
              user_id: userId,
              name: habitTemplate.name,
              description: habitTemplate.description,
              color_code: habitTemplate.color,
              created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ])
          .select()
          .single();

        if (habitError || !habit) {
          console.log(`   ❌ Could not create habit ${habitTemplate.name}`);
          continue;
        }

        console.log(`   📝 Created habit: ${habitTemplate.name}`);
        createdHabits++;

        // Create completion logs for last 7 days with varying patterns
        const logsToCreate = [];
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          // 70% chance of completing each day for variety
          if (Math.random() < 0.7) {
            const date = new Date();
            date.setDate(date.getDate() - dayIdx);
            logsToCreate.push({
              habit_id: habit.id,
              completed_at: date.toISOString().split('T')[0],
            });
          }
        }

        if (logsToCreate.length > 0) {
          const { error: logsError } = await adminClient
            .from('habit_logs')
            .insert(logsToCreate);

          if (logsError) {
            console.log(`      ⚠️ Could not add logs: ${logsError.message}`);
          } else {
            createdLogs += logsToCreate.length;
            const percentage = Math.round((logsToCreate.length / 7) * 100);
            console.log(`      ✅ Added ${logsToCreate.length} completion logs (${percentage}% success)`);
          }
        }
      }

      console.log('');
    }

    console.log('\n✨ Demo data population complete!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ 5 test users created`);
    console.log(`   ✅ ${createdHabits} habits assigned to users`);
    console.log(`   ✅ ${createdLogs} completion logs for realistic activity`);
    console.log('\n🔥 All users are now visible in the Community Feed!\n');
    console.log('📧 Test User Accounts:');
    testUsers.forEach((user) => {
      console.log(`   • ${user.email} (Password: ${user.password})`);
    });

    return {
      success: true,
      message: 'Demo data populated successfully',
      summary: {
        usersCreated: createdUsers,
        habitsCreated: createdHabits,
        logsCreated: createdLogs,
      },
    };
  } catch (error) {
    console.error('❌ Population error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
