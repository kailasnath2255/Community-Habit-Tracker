import { createClient } from '@supabase/supabase-js';

const ADMIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let adminClient: any = null;

if (ADMIN_KEY) {
  adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    ADMIN_KEY
  );
}

const testUsers = [
  { email: 'isha.sharma@example.com', password: 'Test@123456', name: 'Isha Sharma' },
  { email: 'raj.kumar@example.com', password: 'Test@123456', name: 'Raj Kumar' },
  { email: 'priya.patel@example.com', password: 'Test@123456', name: 'Priya Patel' },
  { email: 'arjun.singh@example.com', password: 'Test@123456', name: 'Arjun Singh' },
  { email: 'sneha.desai@example.com', password: 'Test@123456', name: 'Sneha Desai' },
];

const sampleHabits = {
  'isha.sharma@example.com': [
    {
      name: 'Morning Yoga',
      description: 'Daily yoga practice - 30 minutes to start the day',
      color_code: '#8B5CF6',
      completionDays: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      name: 'Read for 30 minutes',
      description: 'Reading English and Hindi literature',
      color_code: '#3B82F6',
      completionDays: [0, 1, 2, 3, 5, 6],
    },
  ],
  'raj.kumar@example.com': [
    {
      name: 'Gym Workout',
      description: 'Strength training and cardio',
      color_code: '#F59E0B',
      completionDays: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      name: 'Meditation',
      description: 'Morning meditation for clarity',
      color_code: '#EC4899',
      completionDays: [0, 2, 4, 6],
    },
  ],
  'priya.patel@example.com': [
    {
      name: 'Cook a Healthy Meal',
      description: 'Prepare nutritious food at home',
      color_code: '#10B981',
      completionDays: [0, 1, 3, 5],
    },
    {
      name: 'Learning Hindi',
      description: 'Improve Hindi language skills',
      color_code: '#06B6D4',
      completionDays: [0, 1, 2, 3, 4, 5],
    },
  ],
  'arjun.singh@example.com': [
    {
      name: 'Running',
      description: 'Daily 5km run in the morning',
      color_code: '#EF4444',
      completionDays: [0, 1, 2, 4, 5, 6],
    },
    {
      name: 'Journaling',
      description: 'Write thoughts and reflections',
      color_code: '#8B5CF6',
      completionDays: [0, 1, 2, 3],
    },
  ],
  'sneha.desai@example.com': [
    {
      name: 'Sketching',
      description: 'Draw for 1 hour daily',
      color_code: '#F97316',
      completionDays: [0, 1, 2, 3, 4, 5, 6],
    },
  ],
};

export async function GET() {
  const results = {
    success: 0,
    failed: 0,
    habitsCreated: 0,
    logsCreated: 0,
    errors: [] as string[],
  };

  if (!adminClient) {
    return Response.json({
      ...results,
      errors: ['Service role key not configured - cannot populate test data'],
    });
  }

  try {
    // Get all existing users
    const { data: allUsers, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      return Response.json({
        ...results,
        errors: [
          `Could not list users: ${listError.message}`,
          'Fallback: You can manually populate data by logging in as test users and using /sample-data page',
        ],
      });
    }

    // Process each test user
    for (const testUser of testUsers) {
      try {
        const existingUser = allUsers.users.find((u: any) => u.email === testUser.email);
        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create user
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true,
          });

          if (createError || !newUser.user) {
            results.errors.push(`Failed to create user ${testUser.email}: ${createError?.message}`);
            results.failed++;
            continue;
          }

          userId = newUser.user.id;
        }

        results.success++;

        // Create habits for this user
        const habits = sampleHabits[testUser.email as keyof typeof sampleHabits] || [];

        for (const habit of habits) {
          const { data: createdHabit, error: habitError } = await adminClient
            .from('habits')
            .insert([
              {
                user_id: userId,
                name: habit.name,
                description: habit.description,
                color_code: habit.color_code,
                created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ])
            .select()
            .single();

          if (habitError || !createdHabit) {
            results.errors.push(
              `Failed to create habit "${habit.name}" for ${testUser.email}: ${habitError?.message}`
            );
            continue;
          }

          results.habitsCreated++;

          // Create completion logs
          const logsData = habit.completionDays.map((daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            return {
              habit_id: createdHabit.id,
              completed_at: date.toISOString().split('T')[0],
            };
          });

          const { error: logsError } = await adminClient
            .from('habit_logs')
            .insert(logsData);

          if (logsError) {
            results.errors.push(
              `Failed to add completion logs for "${habit.name}": ${logsError.message}`
            );
          } else {
            results.logsCreated += logsData.length;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.errors.push(`Error processing ${testUser.email}: ${message}`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.errors.push(`Fatal error: ${message}`);
  }

return Response.json(results);
}
