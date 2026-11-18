import mongoose from 'mongoose';

let memoryServer = null;
let isReplicaSet = false;

export const connectDB = async (uriOverride = null) => {
  const uri = uriOverride || process.env.MONGODB_URI;

  try {
    if (uri) {
      console.log(`[DB] Attempting connection to MongoDB at: ${uri.replace(/\/\/[^@]+@/, '//***:***@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('[DB] MongoDB Connected successfully.');
    } else {
      throw new Error('MONGODB_URI not provided.');
    }
  } catch (err) {
    console.warn(`[DB] Could not connect to primary MongoDB URI (${err.message}).`);
    
    // In development or test, spin up in-memory replica set for full transaction support
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DB] Initializing In-Memory MongoDB Replica Set for demo/development...');
      try {
        const { MongoMemoryReplSet } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryReplSet.create({
          replSet: { count: 1, storageEngine: 'wiredTiger' },
        });
        const memUri = memoryServer.getUri();
        console.log(`[DB] Connecting to In-Memory Replica Set: ${memUri}`);
        await mongoose.connect(memUri);
        isReplicaSet = true;
        console.log('[DB] Connected to In-Memory Replica Set successfully with full transaction support.');
        return mongoose.connection;
      } catch (memErr) {
        console.error('[DB] Failed to start In-Memory Replica Set:', memErr.message);
        throw memErr;
      }
    } else {
      throw err;
    }
  }

  // Check if connected instance is a replica set
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.command({ replSetGetStatus: 1 }).catch(() => null);
    isReplicaSet = !!(status && status.ok);
    console.log(`[DB] Replica Set transaction support detected: ${isReplicaSet ? 'YES' : 'NO (Standalone)'}`);
  } catch {
    isReplicaSet = false;
  }

  return mongoose.connection;
};

export const checkReplicaSetSupport = () => isReplicaSet;

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    console.log('[DB] Disconnected from MongoDB.');
  } catch (err) {
    console.error('[DB] Error during disconnect:', err.message);
  }
};
