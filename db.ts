import { MongoClient, WithId } from 'mongodb';
import {
  IAccountDocument, IChargeStateDocument, IChargingSessionDocument,
} from './types';

const connectPromise = MongoClient.connect(process.env.MONGO_URL as string, { useNewUrlParser: true, useUnifiedTopology: true });
const getDb = async () => {
  const client = await connectPromise;
  return client.db('charge-my-tesla');
};

export const getChargeStateCollection = async () => {
  const db = await getDb();
  return db.collection<WithId<IChargeStateDocument>>('charge-states');
};

export const getChargeSessionCollection = async () => {
  const db = await getDb();
  return db.collection<WithId<IChargingSessionDocument>>('charge-sessions');
};

export const getAccountCollection = async () => {
  const db = await getDb();
  return db.collection<WithId<IAccountDocument>>('accounts');
};

export const getLastKnownChargeState = async (vehicleId: string) => {
  const collection = await getChargeStateCollection();
  const chargeState = collection.findOne({ vehicleId }, { sort: { timestamp: -1 } });
  return chargeState;
};
