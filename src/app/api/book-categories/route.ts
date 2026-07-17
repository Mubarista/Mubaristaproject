import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabaseAdmin
      .from('book_categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Convert to camelCase for frontend consistency
    const camelCaseData = data?.map(item => ({
      id: item.id,
      name: item.name,
      active: item.active,
      orderIndex: item.order_index,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    })) || [];

    return NextResponse.json(camelCaseData);
  } catch (error) {
    console.error('Error fetching book categories:', error);
    return NextResponse.json({ error: 'Failed to fetch book categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle both camelCase and snake_case field names
    const name = body.name;
    const active = body.active !== undefined ? body.active : true;
    const order_index = body.order_index !== undefined ? body.order_index : (body.orderIndex !== undefined ? body.orderIndex : 0);

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('book_categories')
      .insert({ name, active, order_index })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating book category:', error);
    return NextResponse.json({ error: 'Failed to create book category' }, { status: 500 });
  }
}
