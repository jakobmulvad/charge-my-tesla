/* eslint-disable no-await-in-loop */
import Axios, { Method } from 'axios';
import { WithId } from 'mongodb';
import {
  ITeslaApiResponse, ITeslaVehicle, ITeslaChargeState, ITeslaVehicleData, IAccountDocument, ITeslaVehicleState,
} from './types';
import { refreshToken } from './generate_token';
import { getAccountCollection } from './db';

const sleep = (timeout: number) => new Promise((res) => setTimeout(res, timeout));

export const getApi = async (account: WithId<IAccountDocument>) => {
  const { vehicleId } = account;
  let { token } = account;

  // Time to refresh?
  const expiresAt = (token.created_at + token.expires_in - 60) * 1000;
  if (Date.now() > expiresAt) {
    token = await refreshToken(token.refresh_token);
    const accountsColl = await getAccountCollection();
    accountsColl.updateOne({ _id: account._id }, { $set: { token } });
  }

  const axios = Axios.create({
    baseURL: 'https://owner-api.teslamotors.com/api/1/vehicles',
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  const api = {
    getVehicle: async () => (await axios.get<ITeslaVehicle>(`/${vehicleId}`)).data,

    getChargeState: async () => (await axios.get<ITeslaChargeState>(`/${vehicleId}/data_request/charge_state`)).data,

    getVehicleData: async () => (await axios.get<ITeslaVehicleData>(`/${vehicleId}/vehicle_data`)).data,

    wakeVehicle: async () => {
      let vehicle = await api.getVehicle();

      if (vehicle.state !== 'asleep') {
        return;
      }

      console.log('Vehicle is asleep - waking up...');
      await axios(`/${vehicleId}/wake_up`);

      let tries = 0;
      while (vehicle.state === 'asleep') {
        if (tries++ > 20) {
          throw new Error('Vehicle never woke up');
        }
        await sleep(1000);
        vehicle = await api.getVehicle();
      }

      console.log('Vehicle is awake');
    },

    commandStartCharge: async (): Promise<void> => {
      await api.wakeVehicle();
      const chargeState = await api.getChargeState();

      if (chargeState.charging_state !== 'Stopped') {
        console.log(`Cannot charge vehicle because it is in incorrect charging state: ${chargeState.charging_state}`);
        return;
      }

      await axios.post(`/${vehicleId}/command/charge_start`);
    },

    commandStopCharge: async (): Promise<void> => axios.post(`/${vehicleId}/command/charge_stop`),
  };
  return api;
};
