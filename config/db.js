const mongoose = require('mongoose');
const { seedInitialData } = require('../utils/seedData');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/gym_management';

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedInitialData();
    return conn;
  } catch (error) {
    console.warn(`Local MongoDB not reachable (${error.message}). Initializing embedded in-memory MongoDB server...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const inMemoryUri = memoryServer.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`Embedded MongoDB Connected: ${conn.connection.host}`);
      await seedInitialData();
      return conn;
    } catch (memErr) {
      console.error(`Failed to start in-memory MongoDB: ${memErr.message}`);
      throw memErr;
    }
  }
};

module.exports = connectDB;

