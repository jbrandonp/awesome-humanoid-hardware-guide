const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'medical_user',
  password: 'medical_password',
  database: 'medical_db',
});

async function test() {
  try {
    await client.connect();
    console.log('Connected successfully');
    const res = await client.query('SELECT version()');
    console.log(res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

test();