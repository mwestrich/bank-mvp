const pool = require('./backend/db/pool');

async function check() {
  try {
    const res = await pool.query(`
      SELECT a.id, a.user_id, a.joint_user_id, u.full_name as owner_name, j.full_name as joint_owner_name
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users j ON a.joint_user_id = j.id
    `);
    console.log('Accounts query result:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

check();
