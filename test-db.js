const { Client } = require('pg');

const client = new Client({
  host: 'host.docker.internal',
  port: 5432,
  user: 'medical_user',

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
    console.error('Connection error:', err);
  }
}

test();