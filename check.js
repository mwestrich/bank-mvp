const pool = require('./backend/db/pool');

async function checkDB() {
  try {
    const res = await pool.query('SELECT * FROM accounts;');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkDB();
