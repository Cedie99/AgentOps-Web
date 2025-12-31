import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all products or filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');

    let whereClause: any = {};

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (isActive !== null && isActive !== undefined) {
      whereClause.is_active = isActive === 'true';
    }

    if (search) {
      whereClause.OR = [
        { product_name: { contains: search, mode: 'insensitive' } },
        { product_code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_code,
      product_name,
      description,
      category,
      unit_of_measure,
      price,
      cost,
      stock_quantity,
      image_url
    } = body;

    // Validate required fields
    if (!product_code || !product_name || !price) {
      return NextResponse.json(
        { error: 'Product code, name, and price are required' },
        { status: 400 }
      );
    }

    // Check if product code already exists
    const existing = await prisma.product.findUnique({
      where: { product_code }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Product code already exists' },
        { status: 400 }
      );
    }

    console.log('Creating product with data:', {
      product_code,
      product_name,
      price: parseFloat(price),
      cost: cost ? parseFloat(cost) : null,
    });

    const product = await prisma.product.create({
      data: {
        product_code,
        product_name,
        description: description || null,
        category: category || null,
        unit_of_measure: unit_of_measure || 'PIECE',
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        stock_quantity: stock_quantity || 0,
        image_url: image_url || null,
        is_active: true
      }
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      error: 'Failed to create product',
      details: error.message
    }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Convert price and cost to float if provided
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.cost) updateData.cost = parseFloat(updateData.cost);

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
