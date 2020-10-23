import { MongoClient } from 'mongodb';
import { IChargingSessionDocument, ITeslaApiToken, ITeslaChargeState } from './types';

const connectPromise = MongoClient.connect(process.env.MONGO_URL as string, { useNewUrlParser: true, useUnifiedTopology: true });
const getDb = async () => {
  const client = await connectPromise;
  return client.db('charge-my-tesla');
};

export const getTokenCollection = async () => {
  const db = await getDb();
  return db.collection<ITeslaApiToken>('token');
};

export const getChargeStateCollection = async () => {
  const db = await getDb();
  return db.collection<ITeslaChargeState>('charge-state');
};

export const getChargeSessionCollection = async () => {
  const db = await getDb();
  return db.collection<IChargingSessionDocument>('charge-session');
};

export const getLastKnownChargeState = async () => {
  const collection = await getChargeStateCollection();
  const chargeState = collection.findOne({}, { sort: { timestamp: -1 } });
  return chargeState;
};
