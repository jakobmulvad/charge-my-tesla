/* eslint-disable no-await-in-loop */
import Axios, { Method } from 'axios';
import {
  ITeslaApiResponse, ITeslaVehicle, ITeslaChargeState, ITeslaVehicleData, ITeslaApiToken,
} from './types';
import { getToken, refreshToken } from './generate_token';

const sleep = (timeout: number) => new Promise((res) => setTimeout(res, timeout));

let cachedToken: ITeslaApiToken | undefined;

const api = async <T>(method:Method, url: string) : Promise<T> => {
  if (!cachedToken) {
    cachedToken = await getToken();
  }

  const expiresAt = (cachedToken.created_at + cachedToken.expires_in - 60) * 1000;
  if (Date.now() > expiresAt) {
    cachedToken = await refreshToken(cachedToken.refresh_token);
  }

  const response = await Axios.request<ITeslaApiResponse<T>>({
    url, method, baseURL: 'https://owner-api.teslamotors.com/api/1/vehicles', headers: { Authorization: `Bearer ${cachedToken.access_token}` },
  });
  return response.data.response;
};

export const getVehicleList = async (): Promise<ITeslaVehicle[]> => api<ITeslaVehicle[]>('get', '/');

export const getVehicle = async (vehicleId: string): Promise<ITeslaVehicle> => api<ITeslaVehicle>('get', `/${vehicleId}`);

export const wakeVehicle = async (vehicleId: string) => {
  let vehicle = await getVehicle(vehicleId);

  if (vehicle.state !== 'asleep') {
    console.log('Vehicle already awake');
    return;
  }

  console.log('Vehicle is asleep - waking up...');
  await api('post', `/${vehicleId}/wake_up`);

  while (vehicle.state === 'asleep') {
    await sleep(1000);
    vehicle = await getVehicle(vehicleId);
    console.log(`  ${vehicle.state}`);
  }

  console.log('Vehicle is awake');
};

export const getChargeState = async (vehicleId: string): Promise<ITeslaChargeState> => api<ITeslaChargeState>('get', `/${vehicleId}/data_request/charge_state`);

export const getVehicleData = async (vehicleId: string): Promise<ITeslaVehicleData> => api<ITeslaVehicleData>('get', `/${vehicleId}/vehicle_data`);

export const commandStartCharge = async (vehicleId: string): Promise<void> => {
  await wakeVehicle(vehicleId);
  const chargeState = await getChargeState(vehicleId);

  if (chargeState.charging_state !== 'Stopped') {
    console.log(`Cannot charge vehicle because it is in incorrect charging state: ${chargeState.charging_state}`);
    return;
  }

  await api('post', `/${vehicleId}/command/charge_start`);
};

export const commandStopCharge = async (vehicleId: string): Promise<void> => {
  await api('post', `/${vehicleId}/command/charge_stop`);
};
