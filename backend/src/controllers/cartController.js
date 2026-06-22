const pool = require('../config/db');

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ci.id, ci.quantity, ci.reserved_until,
              fp.id as farmer_product_id, fp.stock_quantity,
              p.id as product_id, p.name as product_name, p.image_url, p.unit,
              gp.price_per_unit,
              u.id as farmer_id, u.name as farmer_name,
              prof.farm_name
       FROM carts c
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN farmer_products fp ON fp.id = ci.farmer_product_id
       JOIN products p ON p.id = fp.product_id
       LEFT JOIN government_prices gp ON gp.product_id = p.id AND gp.is_active = true
       JOIN users u ON u.id = fp.farmer_id
       LEFT JOIN farmer_profiles prof ON prof.farmer_id = u.id
       WHERE c.buyer_id = $1 AND ci.reserved_until > NOW()
       ORDER BY ci.created_at`,
      [req.user.id]
    );

    const items = result.rows;
    const total = items.reduce((sum, item) => sum + (item.price_per_unit * item.quantity), 0);

    res.json({ success: true, data: { items, total } });
  } catch (err) {
    next(err);
  }
};

// POST /api/cart/items — atomic reservation
const addToCart = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { farmer_product_id, quantity } = req.body;
    if (!farmer_product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'farmer_product_id and quantity > 0 required' });
    }

    await client.query('BEGIN');

    // Lock the farmer_product row to prevent race conditions
    const fpResult = await client.query(
      'SELECT * FROM farmer_products WHERE id = $1 AND is_available = true FOR UPDATE',
      [farmer_product_id]
    );

    if (fpResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Product not available' });
    }

    const fp = fpResult.rows[0];

    // Calculate currently reserved quantity (active reservations, excluding this buyer's own)
    const reservedResult = await client.query(
      `SELECT COALESCE(SUM(ci.quantity), 0) as reserved
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       WHERE ci.farmer_product_id = $1 AND ci.reserved_until > NOW() AND c.buyer_id != $2`,
      [farmer_product_id, req.user.id]
    );

    const reserved = parseFloat(reservedResult.rows[0].reserved);
    const available = fp.stock_quantity - reserved;

    if (quantity > available) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: `Only ${available} ${fp.stock_quantity > 0 ? 'units available' : '(out of stock)'}`,
        available
      });
    }

    // Get buyer's cart or create on-the-fly if missing
    let cartResult = await client.query('SELECT id FROM carts WHERE buyer_id = $1', [req.user.id]);
    let cart_id;
    if (cartResult.rows.length === 0) {
      const newCartResult = await client.query(
        'INSERT INTO carts (buyer_id) VALUES ($1) RETURNING id',
        [req.user.id]
      );
      cart_id = newCartResult.rows[0].id;
    } else {
      cart_id = cartResult.rows[0].id;
    }

    // Upsert cart item
    const itemResult = await client.query(
      `INSERT INTO cart_items (cart_id, farmer_product_id, quantity, reserved_until)
       VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')
       ON CONFLICT (cart_id, farmer_product_id) DO UPDATE
       SET quantity = $3, reserved_until = NOW() + INTERVAL '15 minutes'
       RETURNING *`,
      [cart_id, farmer_product_id, quantity]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: itemResult.rows[0], message: 'Added to cart (reserved for 15 min)' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// DELETE /api/cart/items/:id
const removeFromCart = async (req, res, next) => {
  try {
    await pool.query(
      `DELETE FROM cart_items ci
       USING carts c
       WHERE ci.id = $1 AND ci.cart_id = c.id AND c.buyer_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart — clear
const clearCart = async (req, res, next) => {
  try {
    await pool.query(
      `DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE buyer_id = $1)`,
      [req.user.id]
    );
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, removeFromCart, clearCart };
