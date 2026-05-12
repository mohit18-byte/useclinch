import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/invoices — list all invoices for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch invoices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoices', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
