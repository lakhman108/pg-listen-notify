const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'notify_demo',
});

async function main() {
  await client.connect();
  await client.query('LISTEN item_added');

  console.log('Listening for new items...');

  client.on('notification', (msg) => {
    console.log(`[${msg.channel}]`, JSON.parse(msg.payload));
  });

  client.on('error', (err) => {
    console.error('Postgres client error:', err);
  });
}

main();