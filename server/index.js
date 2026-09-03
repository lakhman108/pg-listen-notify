const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'notify_demo',
};

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const BACKOFF_FACTOR = 2;

let currentDelay = BASE_DELAY_MS;
let client = null;
let reconnecting = false;

function scheduleReconnect() {
  if (reconnecting) return; // guard: never stack multiple timers
  reconnecting = true;

  if (client) {
    client.removeAllListeners();
    client.end().catch(() => {}); // ignore errors closing a dead connection
  }

  console.log(`Reconnecting in ${currentDelay / 1000}s...`);
  setTimeout(() => {
    reconnecting = false;
    startListener();
  }, currentDelay);

  // grow delay for the *next* failure, capped at MAX_DELAY_MS
  currentDelay = Math.min(currentDelay * BACKOFF_FACTOR, MAX_DELAY_MS);
}

function startListener() {
  client = new Client(config);

  client.connect()
    .then(async () => {
      await client.query('LISTEN item_added');
      console.log('Listening for new items...');
      currentDelay = BASE_DELAY_MS; // reset backoff on success
    })
    .catch((err) => {
      console.error('Failed to connect:', err.message);
      scheduleReconnect();
    });

  client.on('notification', (msg) => {
    console.log(`[${msg.channel}]`, JSON.parse(msg.payload));
  });

  client.on('error', (err) => {
    console.error('Postgres client error:', err.message);
    scheduleReconnect();
  });

  client.on('end', () => {
    console.log('Connection closed.');
    scheduleReconnect();
  });
}

startListener();