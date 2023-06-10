import { Sender } from '@questdb/nodejs-client';
import * as dotenv from 'dotenv';

// Load values from .env file into process.env
dotenv.config();

const { 
  QUESTDB_HOST,
  QUESTDB_PORT,
  QUESTDB_BUFFER_BYTES,
  READINGS_TO_GENERATE,
  MIN_SLEEP_MILLIS,
  MAX_SLEEP_MILLIS,
} = process.env;

// Make an array of sensor IDs...
const SENSOR_IDS = process.env.SENSOR_IDS.split(',');

// Generate a random float in a supplied range 
// with a given number of decimal places.
function generateRandomFloat(min, max, dp) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dp));
}

// Generate a random int in a supplied range.
function generateRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Sleep for a given number of milliseconds.
async function sleep(sleepMillis) {
  return new Promise((resolve) => {
    setTimeout(resolve, sleepMillis);
  });
};

try {
  // Create a sender and set the buffer size.
  const sender = new Sender({
    bufferSize: QUESTDB_BUFFER_BYTES
  });

  // Connect to QuestDB.
  await sender.connect({ 
    host: QUESTDB_HOST,
    port: QUESTDB_PORT
  });

  let readingsGenerated = 0;
  console.log(`Will generate ${READINGS_TO_GENERATE} readings...`);

  while (readingsGenerated < READINGS_TO_GENERATE) {
    // Pick a random sensor ID and generate a temperature reading.
    const sensorId = SENSOR_IDS[generateRandomInt(0, SENSOR_IDS.length - 1)];
    const temp = generateRandomFloat(18, 22, 1);

    sender.table('temperature')
      .symbol('sensor_id', sensorId)
      .floatColumn('temp_c', temp)
      .atNow();

    // Generate a humiidity reading.
    const humidity = generateRandomFloat(72, 85, 1);

    sender.table('humidity')
      .symbol('sensor_id', sensorId)
      .floatColumn('rel_humidity', humidity)
      .atNow();

    // Flush the buffer, send data to QuestDB.
    await sender.flush();

    console.log(`Sensor ${sensorId}: temp = ${temp}, humidity = ${humidity}`);

    // Wait a moment...
    await sleep(generateRandomInt(MIN_SLEEP_MILLIS, MAX_SLEEP_MILLIS));

    readingsGenerated += 1;
  }

  console.log(`Finished, generated ${readingsGenerated} readings.`);

  // Close connection to QuestDB as we are done.
  await sender.close();
} catch (e) {
  // Oops...
  console.error('Something went wrong!');
  console.error(e);
}