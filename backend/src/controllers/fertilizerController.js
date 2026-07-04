const pool = require('../config/db');

// ─────────────────────────────────────────────
// Haversine helper
// ─────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════
// ADMIN — FERTILIZER TYPES
// ═══════════════════════════════════════════════

const getTypes = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM fertilizer_types ORDER BY name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

const createType = async (req, res, next) => {
  try {
    const { name, description, unit = 'kg', image_url } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const result = await pool.query(
      `INSERT INTO fertilizer_types (name, description, unit, image_url) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, description || null, unit, image_url || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

const updateType = async (req, res, next) => {
  try {
    const { name, description, unit, image_url, is_active } = req.body;
    const result = await pool.query(
      `UPDATE fertilizer_types SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        unit = COALESCE($3, unit),
        image_url = COALESCE($4, image_url),
        is_active = COALESCE($5, is_active)
       WHERE id = $6 RETURNING *`,
      [name, description, unit, image_url, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Type not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// ADMIN — BRANCHES
// ═══════════════════════════════════════════════

const getBranches = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM fertilizer_branches WHERE is_active = true ORDER BY name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

const createBranch = async (req, res, next) => {
  try {
    const { name, address, location_lat, location_lng, phone } = req.body;
    if (!name || !address) return res.status(400).json({ success: false, message: 'Name and address are required' });
    const result = await pool.query(
      `INSERT INTO fertilizer_branches (name, address, location_lat, location_lng, phone)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, address, location_lat || null, location_lng || null, phone || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

const updateBranch = async (req, res, next) => {
  try {
    const { name, address, location_lat, location_lng, phone, is_active } = req.body;
    const result = await pool.query(
      `UPDATE fertilizer_branches SET
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        location_lat = COALESCE($3, location_lat),
        location_lng = COALESCE($4, location_lng),
        phone = COALESCE($5, phone),
        is_active = COALESCE($6, is_active)
       WHERE id = $7 RETURNING *`,
      [name, address, location_lat, location_lng, phone, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// ADMIN — PROGRAMS
// ═══════════════════════════════════════════════

const getPrograms = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT fp.*, ft.name as fertilizer_name, ft.unit, ft.description as fertilizer_description,
              fb.name as branch_name, fb.address as branch_address,
              COUNT(fa.id) as total_claims
       FROM fertilizer_programs fp
       JOIN fertilizer_types ft ON ft.id = fp.fertilizer_type_id
       JOIN fertilizer_branches fb ON fb.id = fp.branch_id
       LEFT JOIN fertilizer_allocations fa ON fa.program_id = fp.id
       GROUP BY fp.id, ft.name, ft.unit, ft.description, fb.name, fb.address
       ORDER BY fp.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

const createProgram = async (req, res, next) => {
  try {
    const {
      fertilizer_type_id, month, distribution_date,
      total_quantity, quantity_per_farmer,
      subsidized_price, market_price, branch_id, notes
    } = req.body;

    if (!fertilizer_type_id || !month || !distribution_date || !total_quantity || !subsidized_price || !branch_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO fertilizer_programs
        (fertilizer_type_id, month, distribution_date, total_quantity, available_quantity,
         quantity_per_farmer, subsidized_price, market_price, branch_id, notes)
       VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [fertilizer_type_id, month, distribution_date, total_quantity,
       quantity_per_farmer || 10, subsidized_price, market_price || null, branch_id, notes || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

const updateProgram = async (req, res, next) => {
  try {
    const {
      distribution_date, total_quantity, available_quantity,
      quantity_per_farmer, subsidized_price, market_price,
      branch_id, status, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE fertilizer_programs SET
        distribution_date = COALESCE($1, distribution_date),
        total_quantity = COALESCE($2, total_quantity),
        available_quantity = COALESCE($3, available_quantity),
        quantity_per_farmer = COALESCE($4, quantity_per_farmer),
        subsidized_price = COALESCE($5, subsidized_price),
        market_price = COALESCE($6, market_price),
        branch_id = COALESCE($7, branch_id),
        status = COALESCE($8, status),
        notes = COALESCE($9, notes),
        updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [distribution_date, total_quantity, available_quantity, quantity_per_farmer,
       subsidized_price, market_price, branch_id, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Program not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// PATCH /admin/fertilizers/programs/:id/quantity — quick +/- adjustment
const adjustQuantity = async (req, res, next) => {
  try {
    const { delta } = req.body; // positive = increase, negative = decrease
    if (delta === undefined) return res.status(400).json({ success: false, message: 'delta required' });
    const result = await pool.query(
      `UPDATE fertilizer_programs
       SET available_quantity = GREATEST(0, available_quantity + $1), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [delta, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Program not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

const getProgramAllocations = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id as farmer_id, 
        u.name as farmer_name, 
        u.phone as farmer_phone, 
        u.email as farmer_email,
        u.location_address as farmer_location,
        fa.id as allocation_id,
        fa.quantity,
        fa.status as allocation_status,
        fa.claimed_at,
        fa.collected_at
       FROM users u
       LEFT JOIN fertilizer_allocations fa ON fa.farmer_id = u.id AND fa.program_id = $1
       WHERE u.role = 'farmer' AND u.is_active = true
       ORDER BY CASE WHEN fa.status = 'claimed' THEN 1 WHEN fa.status = 'collected' THEN 2 ELSE 3 END ASC, u.name ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

const collectAllocationAdmin = async (req, res, next) => {
  try {
    const { id: programId } = req.params;
    const { farmer_id } = req.body;

    if (!farmer_id) {
      return res.status(400).json({ success: false, message: 'farmer_id is required' });
    }

    // Check if program exists
    const progRes = await pool.query(
      `SELECT * FROM fertilizer_programs WHERE id = $1`,
      [programId]
    );
    if (progRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    const program = progRes.rows[0];

    // Check if farmer has an allocation
    const allocRes = await pool.query(
      `SELECT * FROM fertilizer_allocations WHERE program_id = $1 AND farmer_id = $2`,
      [programId, farmer_id]
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let allocation;
      if (allocRes.rows.length > 0) {
        const existing = allocRes.rows[0];
        if (existing.status === 'collected') {
          await client.query('COMMIT');
          return res.json({ success: true, data: existing, message: 'Already collected' });
        }

        const updateRes = await client.query(
          `UPDATE fertilizer_allocations SET status = 'collected', collected_at = NOW()
           WHERE id = $1 RETURNING *`,
          [existing.id]
        );
        allocation = updateRes.rows[0];
      } else {
        if (program.available_quantity < program.quantity_per_farmer) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: 'Insufficient quota remaining in this program' });
        }

        const insertRes = await client.query(
          `INSERT INTO fertilizer_allocations (program_id, farmer_id, quantity, status, collected_at)
           VALUES ($1, $2, $3, 'collected', NOW()) RETURNING *`,
          [programId, farmer_id, program.quantity_per_farmer]
        );
        allocation = insertRes.rows[0];

        await client.query(
          `UPDATE fertilizer_programs SET available_quantity = available_quantity - $1, updated_at = NOW()
           WHERE id = $2`,
          [program.quantity_per_farmer, programId]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true, data: allocation, message: 'Fertilizer marked as collected' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
};

// PATCH /admin/fertilizers/allocations/:id/status
const updateAllocationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const collected_at = status === 'collected' ? new Date().toISOString() : null;
    const result = await pool.query(
      `UPDATE fertilizer_allocations SET status = $1, collected_at = COALESCE($2::timestamptz, collected_at)
       WHERE id = $3 RETURNING *`,
      [status, collected_at, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Allocation not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// FARMER — VIEW PROGRAMS
// ═══════════════════════════════════════════════

const getFarmerPrograms = async (req, res, next) => {
  try {
    const farmerRes = await pool.query(
      `SELECT location_lat, location_lng FROM users WHERE id = $1`,
      [req.user.id]
    );
    const farmer = farmerRes.rows[0];
    const fLat = farmer?.location_lat ? parseFloat(farmer.location_lat) : null;
    const fLng = farmer?.location_lng ? parseFloat(farmer.location_lng) : null;

    // Get all branches for distance calc
    const branchRes = await pool.query(`SELECT * FROM fertilizer_branches WHERE is_active = true`);
    const branches = branchRes.rows.map(b => ({
      ...b,
      distance_km: fLat && fLng && b.location_lat && b.location_lng
        ? Math.round(haversineKm(fLat, fLng, parseFloat(b.location_lat), parseFloat(b.location_lng)) * 10) / 10
        : null
    }));

    // Get programs that are upcoming or open
    const result = await pool.query(
      `SELECT fp.*, ft.name as fertilizer_name, ft.unit, ft.description as fertilizer_description, ft.image_url,
              fb.name as branch_name, fb.address as branch_address, fb.phone as branch_phone,
              fb.location_lat as branch_lat, fb.location_lng as branch_lng,
              fa.id as my_claim_id, fa.status as my_claim_status, fa.quantity as my_claim_quantity,
              fa.claimed_at as my_claimed_at
       FROM fertilizer_programs fp
       JOIN fertilizer_types ft ON ft.id = fp.fertilizer_type_id
       JOIN fertilizer_branches fb ON fb.id = fp.branch_id
       LEFT JOIN fertilizer_allocations fa ON fa.program_id = fp.id AND fa.farmer_id = $1
       WHERE fp.status IN ('upcoming', 'open')
       ORDER BY fp.distribution_date ASC`,
      [req.user.id]
    );

    const programs = result.rows.map(p => {
      const branchDist =
        fLat && fLng && p.branch_lat && p.branch_lng
          ? Math.round(haversineKm(fLat, fLng, parseFloat(p.branch_lat), parseFloat(p.branch_lng)) * 10) / 10
          : null;

      // Nearest branch overall
      const sortedBranches = [...branches].sort((a, b) =>
        a.distance_km === null ? 1 : b.distance_km === null ? -1 : a.distance_km - b.distance_km
      );

      return { ...p, branch_distance_km: branchDist, nearest_branches: sortedBranches.slice(0, 3) };
    });

    res.json({ success: true, data: programs });
  } catch (err) { next(err); }
};

// POST /farmer/fertilizers/:programId/claim
const claimAllocation = async (req, res, next) => {
  try {
    const { programId } = req.params;

    // Verify program is open and has capacity
    const progRes = await pool.query(
      `SELECT * FROM fertilizer_programs WHERE id = $1 AND status = 'open'`,
      [programId]
    );
    if (progRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Program is not open for claims' });
    }
    const program = progRes.rows[0];

    if (program.available_quantity < program.quantity_per_farmer) {
      return res.status(400).json({ success: false, message: 'Insufficient quota remaining' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert allocation (unique constraint handles duplicate claims)
      const allocRes = await client.query(
        `INSERT INTO fertilizer_allocations (program_id, farmer_id, quantity)
         VALUES ($1, $2, $3) RETURNING *`,
        [programId, req.user.id, program.quantity_per_farmer]
      );

      // Deduct from available quantity
      await client.query(
        `UPDATE fertilizer_programs SET available_quantity = available_quantity - $1, updated_at = NOW()
         WHERE id = $2`,
        [program.quantity_per_farmer, programId]
      );

      await client.query('COMMIT');
      res.status(201).json({ success: true, data: allocRes.rows[0], message: 'Allocation claimed successfully!' });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(409).json({ success: false, message: 'You have already claimed this allocation' });
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
};

// GET /farmer/fertilizers/my-claims
const getMyClaims = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT fa.*, fp.distribution_date, fp.subsidized_price, fp.month,
              ft.name as fertilizer_name, ft.unit,
              fb.name as branch_name, fb.address as branch_address, fb.phone as branch_phone
       FROM fertilizer_allocations fa
       JOIN fertilizer_programs fp ON fp.id = fa.program_id
       JOIN fertilizer_types ft ON ft.id = fp.fertilizer_type_id
       JOIN fertilizer_branches fb ON fb.id = fp.branch_id
       WHERE fa.farmer_id = $1
       ORDER BY fa.claimed_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

module.exports = {
  // Admin — types
  getTypes, createType, updateType,
  // Admin — branches
  getBranches, createBranch, updateBranch,
  // Admin — programs
  getPrograms, createProgram, updateProgram, adjustQuantity,
  getProgramAllocations, collectAllocationAdmin, updateAllocationStatus,
  // Farmer
  getFarmerPrograms, claimAllocation, getMyClaims,
};
