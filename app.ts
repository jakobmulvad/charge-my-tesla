/* eslint-disable import/first */
import { config } from 'dotenv';

config();

import { ObjectID, WithId } from 'mongodb';
import { createServer } from 'http';
import Axios from 'axios';
import { getApi } from './api';
import {
  getAccountCollection, getChargeSessionCollection, getChargeStateCollection, getLastKnownChargeState,
} from './db';
import { IAccountDocument, ITeslaChargeState } from './types';

const MILLIS_IN_HOUR = (1000 * 60 * 60);

const hoursBetween = (dateA: Date, dateB: Date) => Math.abs(dateA.getTime() - dateB.getTime()) / MILLIS_IN_HOUR;
const hoursSince = (timestamp: number) => (new Date().getTime() - timestamp) / MILLIS_IN_HOUR;

const shouldChargeAt = (hourUTC:number, startHourUTC: number, endHourUTC: number) => {
  if (startHourUTC > endHourUTC) {
    return hourUTC > startHourUTC || hourUTC < endHourUTC;
  }
  return hourUTC > startHourUTC && hourUTC < endHourUTC;
};

const chargeLogicVehicle = async (account: WithId<IAccountDocument>) => {
  const { vehicleId } = account;
  const api = await getApi(account);

  const vehicle = await api.getVehicle();

  const now = new Date();
  const shouldCharge = shouldChargeAt(now.getUTCHours(), account.chargingHoursStartUTC, account.chargingHoursEndUTC);

  const getAndStoreChargeState = async () => {
    await api.wakeVehicle();
    const chargeState = await api.getChargeState();
    const chargeStateCollection = await getChargeStateCollection();
    await chargeStateCollection.insertOne({ vehicleId, ...chargeState });
    return chargeState;
  };

  const lastKnownChargeState = await getLastKnownChargeState(vehicleId);
  const chargeSessionCollection = await getChargeSessionCollection();
  const openSession = await chargeSessionCollection.findOne(
    { stop: { $exists: false } },
    { sort: { start: -1 } },
  );

  const closeChargeSession = async (chargeState: ITeslaChargeState) => {
    if (openSession) {
      const hoursSinceLastUpdate = hoursBetween(now, openSession.lastUpdated);
      const powerConsumed = chargeState.charger_power * hoursSinceLastUpdate;
      const minutesSinceStart = (now.getTime() - openSession.start.getTime()) / (1000 * 60);
      console.log(
        `Charging session closed! Total time: ${Math.round(minutesSinceStart)} mins, total power consumed: ${openSession.powerConsumed + powerConsumed}`,
      );
      await chargeSessionCollection.updateOne(
        // eslint-disable-next-line no-underscore-dangle
        { _id: openSession._id },
        { $set: { stop: now, lastUpdated: now }, $inc: { powerConsumed } },
      );
    }
  };

  // OUTSIDE SLOT
  if (!shouldCharge) {
    if (openSession) {
      console.log('Vehicle in charging session outside timeslot - close session');

      const chargeState = await getAndStoreChargeState();
      await api.commandStopCharge();
      await closeChargeSession(chargeState);
      return;
    }

    // Stale charge state?
    if (vehicle.state === 'online' && (!lastKnownChargeState || hoursSince(lastKnownChargeState?.timestamp) > 3)) {
      console.log('Outside charging slot and last known charge state is stale - wait for data gathering');
      return;
    }

    if (lastKnownChargeState?.charging_state === 'Charging') {
      console.log('Outside charging slot and last known charge state is "Charging" - stop charging');
      await api.commandStopCharge();
      await getAndStoreChargeState();
      return;
    }
    return;
  }

  // INSIDE SLOT
  if (!openSession) {
    if (lastKnownChargeState?.charging_state === 'Complete') {
      // done!
      return;
    }

    console.log('Vehicle not in charging session inside timeslot - start new session');
    await api.commandStartCharge();
    await chargeSessionCollection.insertOne({
      start: now,
      lastUpdated: now,
      powerConsumed: 0,
    });
    return;
  }

  // We have an active charge session and are inside charging timeslot - update session
  const chargeState = await getAndStoreChargeState();

  if (chargeState.charging_state === 'Complete') {
    console.log('Charging complete! - closing session');
    await closeChargeSession(chargeState);
    return;
  }

  const hoursSinceLastUpdate = hoursBetween(now, openSession.lastUpdated);
  const powerConsumed = chargeState.charger_power * hoursSinceLastUpdate;
  await chargeSessionCollection.updateOne(
    // eslint-disable-next-line no-underscore-dangle
    { _id: new ObjectID((openSession as any)._id) },
    { $set: { lastUpdated: now }, $inc: { powerConsumed } },
  );
};

const chargeLogic = async () => {
  console.log(`${new Date().toJSON().slice(0, 19)} Running charge logic...`);
  const accountsColl = await getAccountCollection();
  const accounts = await accountsColl.find({}).toArray();
  // eslint-disable-next-line no-restricted-syntax
  for (const account of accounts) {
    // eslint-disable-next-line no-await-in-loop
    await chargeLogicVehicle(account);
  }
};

/* const dataCollection = async (vehicleId: string) => {
  console.log('Running data collection...');
  const vehicle = await getVehicle(vehicleId);

  if (vehicle.state === 'asleep') {
    console.log('Vehicle is asleep - aborting');
    return;
  }

  const chargeState = await getChargeState(vehicleId);
  const chargeStateCollection = await getChargeStateCollection();
  await chargeStateCollection.insertOne(chargeState);
}; */

(async () => {
  try {
    setInterval(() => chargeLogic(), 1000 * 60 * 1); // execute start/stop charge logic every minute
    // setInterval(() => dataCollection(vehicle.id_s), 1000 * 60 * 15); // execute data collection

    const { SELF_URL } = process.env;
    if (SELF_URL) {
      console.log(`Starting self ping to url: ${SELF_URL}`);
      setInterval(() => Axios.get(SELF_URL), 1000 * 60 * 20); // Keep alive ping every 20 minutes
    }

    const server = createServer((req, res) => {
      res.statusCode = 204;
      res.end();
    });

    server.listen(process.env.PORT, () => {
      console.log('Charge my tesla is running!');
    });
  } catch (e) {
    console.error('App failed to start');
    console.error(e);
  }
})();

/*

{
  battery_heater_on: false,
  battery_level: 49,
  battery_range: 142.27,
  charge_current_request: 16,
  charge_current_request_max: 16,
  charge_enable_request: true,
  charge_energy_added: 0.21,
  charge_limit_soc: 84,
  charge_limit_soc_max: 100,
  charge_limit_soc_min: 50,
  charge_limit_soc_std: 90,
  charge_miles_added_ideal: 1,
  charge_miles_added_rated: 1,
  charge_port_cold_weather_mode: false,
  charge_port_door_open: true,
  charge_port_latch: 'Engaged',
  charge_rate: 41.2,
  charge_to_max_range: false,
  charger_actual_current: 16,
  charger_phases: 2,
  charger_pilot_current: 16,
  charger_power: 11,
  charger_voltage: 228,
  charging_state: 'Charging',
  conn_charge_cable: 'SAE',
  est_battery_range: 127.21,
  fast_charger_brand: '<invalid>',
  fast_charger_present: false,
  fast_charger_type: '<invalid>',
  ideal_battery_range: 142.27,
  managed_charging_active: false,
  managed_charging_start_time: null,
  managed_charging_user_canceled: false,
  max_range_charge_counter: 0,
  minutes_to_full_charge: 140,
  not_enough_power_to_heat: null,
  scheduled_charging_pending: false,
  scheduled_charging_start_time: null,
  time_to_full_charge: 2.33,
  timestamp: 1603304275299,
  trip_charging: false,
  usable_battery_level: 49,
  user_charge_enable_request: null
}
*/
