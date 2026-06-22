require('dotenv').config();
const { Client } = require('pg');

async function setup() {
  // Step 1: Create database if needed
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'agrimarket'");
    if (res.rows.length === 0) {
      await adminClient.query('CREATE DATABASE agrimarket');
      console.log('✅ Created database: agrimarket');
    } else {
      console.log('ℹ️  Database agrimarket already exists');
    }
    await adminClient.end();
  } catch (err) {
    console.error('❌ Failed to create database:', err.message);
    try { await adminClient.end(); } catch {}
    process.exit(1);
  }

  // Step 2: Run migration statements one by one
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'agrimarket',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Connected to agrimarket');

    // Enable UUID
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('  ✓ uuid-ossp extension');

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'farmer', 'admin')),
        id_number VARCHAR(100),
        avatar_url TEXT,
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        location_address TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ users table');

    // Farmer profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS farmer_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        farmer_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        farm_name VARCHAR(200),
        address TEXT,
        rating_avg DECIMAL(3,2) DEFAULT 0,
        total_ratings INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ farmer_profiles table');

    // Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        image_url TEXT,
        unit VARCHAR(20) DEFAULT 'kg' CHECK (unit IN ('kg', 'piece', 'bunch', 'liter')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ products table');

    // Government prices
    await client.query(`
      CREATE TABLE IF NOT EXISTS government_prices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        price_per_unit DECIMAL(10,2) NOT NULL,
        effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
        set_by_admin_id UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ government_prices table');

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_active_price_per_product
        ON government_prices(product_id) WHERE is_active = true
    `);

    // Farmer products
    await client.query(`
      CREATE TABLE IF NOT EXISTS farmer_products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(farmer_id, product_id)
      )
    `);
    console.log('  ✓ farmer_products table');

    // Carts
    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        buyer_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ carts table');

    // Cart items
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        farmer_product_id UUID NOT NULL REFERENCES farmer_products(id) ON DELETE CASCADE,
        quantity DECIMAL(10,2) NOT NULL,
        reserved_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(cart_id, farmer_product_id)
      )
    `);
    console.log('  ✓ cart_items table');

    // Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        buyer_id UUID NOT NULL REFERENCES users(id),
        farmer_id UUID NOT NULL REFERENCES users(id),
        status VARCHAR(30) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending','accepted','rejected','preparing','out_for_delivery','delivered','completed','cancelled')),
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(20) DEFAULT 'cod' CHECK (payment_method IN ('cod','digital')),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded')),
        delivery_address TEXT,
        delivery_lat DECIMAL(10, 8),
        delivery_lng DECIMAL(11, 8),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ orders table');

    // Order items
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        farmer_product_id UUID NOT NULL REFERENCES farmer_products(id),
        quantity DECIMAL(10,2) NOT NULL,
        price_at_order DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ order_items table');

    // Reviews
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        buyer_id UUID NOT NULL REFERENCES users(id),
        farmer_id UUID NOT NULL REFERENCES users(id),
        order_id UUID UNIQUE NOT NULL REFERENCES orders(id),
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ reviews table');

    // Notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ notifications table');

    // Indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_farmer_products_farmer ON farmer_products(farmer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_farmer_products_product ON farmer_products(product_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_government_prices_product ON government_prices(product_id)');
    console.log('  ✓ indexes');

    // Seed: Admin user (password: password)
    await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ('Admin', 'admin@agrimarket.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('  ✓ admin user seeded (admin@agrimarket.com / password)');

    // Seed: Products
    const products = [
      ['Tomato', 'Fresh red tomatoes, perfect for cooking and salads', 'Vegetables', 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400', 'kg'],
      ['Carrot', 'Crispy orange carrots, rich in vitamins', 'Vegetables', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400', 'kg'],
      ['Potato', 'Versatile potatoes for all cooking needs', 'Vegetables', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400', 'kg'],
      ['Spinach', 'Fresh green spinach leaves', 'Leafy Greens', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', 'kg'],
      ['Onion', 'Red and white onions, freshly harvested', 'Vegetables', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400', 'kg'],
      ['Broccoli', 'Fresh green broccoli, high in nutrients', 'Vegetables', 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400', 'kg'],
      ['Cucumber', 'Cool and crisp cucumbers', 'Vegetables', 'https://images.unsplash.com/photo-1568584263172-6b5d3f0f9076?w=400', 'kg'],
      ['Bell Pepper', 'Colorful bell peppers - red, green, yellow', 'Vegetables', 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400', 'kg'],
      ['Cabbage', 'Fresh green cabbage heads', 'Vegetables', 'https://images.unsplash.com/photo-1594282401757-0d4ab2e78c6a?w=400', 'kg'],
      ['Bitter Gourd', 'Fresh bitter gourd for healthy cooking', 'Vegetables', 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400', 'kg'],
    ];

    for (const [name, desc, cat, img, unit] of products) {
      await client.query(
        `INSERT INTO products (name, description, category, image_url, unit)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [name, desc, cat, img, unit]
      );
    }
    console.log('  ✓ 10 products seeded');

    await client.end();
    console.log('');
    console.log('🎉 Setup complete! Run: npm run dev');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

setup();
