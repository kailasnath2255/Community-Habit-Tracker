import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Try to get the user
    const { data: { user }, error } = await supabase.auth.getUser();

    console.log('[/api/auth-test] Auth check:', {
      userId: user?.id,
      email: user?.email,
      error: error?.message,
    });

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          details: 'Failed to get user from session'
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No user in session',
          details: 'Auth cookies may not be set'
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      message: 'Auth is working correctly',
    });
  } catch (error) {
    console.error('[/api/auth-test] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
