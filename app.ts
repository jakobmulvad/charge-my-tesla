import { config } from "dotenv";
config({ path: ".env" });

import {
  getChargeState,
  getVehicle,
  getVehicleList,
  commandStopCharge,
  commandStartCharge,
} from "./api";
import { getChargeSessionCollection, getChargeStateCollection } from "./db";
import { ObjectID } from "mongodb";
import { ITeslaChargeState } from "./types";
import { createServer } from "http";
import { keepAlive } from "./keep-alive";

const chargeLogic = async (vehicleId: string) => {
  console.log("Running charge logic...");

  const vehicle = await getVehicle(vehicleId);

  const now = new Date();
  const hours = now.getHours();
  const shouldCharge = hours > 0 && hours < 8;

  const chargeSessionCollection = await getChargeSessionCollection();
  const openSession = await chargeSessionCollection.findOne(
    { stop: { $exists: false } },
    { sort: { start: -1 } }
  );

  const closeChargeSession = async (chargeState: ITeslaChargeState) => {
    if (openSession) {
      const hoursSinceLastUpdate =
        (now.getTime() - openSession.start.getTime()) / (1000 * 60 * 60);
      const powerConsumed = chargeState.charger_power * hoursSinceLastUpdate;
      const minutesSinceStart =
        (now.getTime() - openSession.start.getTime()) / (1000 * 60);
      console.log(
        `Charging complete! Total time: ${Math.round(minutesSinceStart)} mins`
      );
      await chargeSessionCollection.updateOne(
        { _id: new ObjectID((openSession as any)._id) },
        { $set: { stop: now, lastUpdated: now }, $inc: { powerConsumed } }
      );
    }
  };

  if (vehicle.state !== "asleep") {
    const chargeState = await getChargeState(vehicleId);
    if (chargeState.charging_state === "Charging" && !shouldCharge) {
      console.log("Vehicle is charging outside timeslot - stopping");
      await commandStopCharge(vehicleId);
      await closeChargeSession(chargeState);
      return;
    }
  }

  if (shouldCharge) {
    const chargeState = await getChargeState(vehicleId);

    switch (chargeState.charging_state) {
      case "Stopped": {
        console.log(
          "Vehicle is not charging in charging timeslot - start new session"
        );
        await commandStartCharge(vehicleId);
        await chargeSessionCollection.insertOne({
          start: now,
          lastUpdated: now,
          powerConsumed: 0,
        });
        return;
      }

      case "Charging": {
        if (openSession) {
          console.log(
            "Vehicle is charging in charging timeslot - update session"
          );
          const hoursSinceLastUpdate =
            (now.getTime() - openSession.start.getTime()) / (1000 * 60 * 60);
          const powerConsumed =
            chargeState.charger_power * hoursSinceLastUpdate;
          await chargeSessionCollection.updateOne(
            { _id: new ObjectID((openSession as any)._id) },
            { $set: { lastUpdated: now }, $inc: { powerConsumed } }
          );
        } else {
          console.log("Charging without an open session - SOMETHING IS WRONG");
        }
        return;
      }

      case "Complete": {
        if (chargeState.charging_state === "Complete") {
          console.log("Vehicle is done charging in charging timeslot");
          await closeChargeSession(chargeState);
        }
        return;
      }
    }
  }

  console.log("Vehicle is outside timeslot - do nothing");
};

const dataCollection = async (vehicleId: string) => {
  console.log("Running data collection...");
  const vehicle = await getVehicle(vehicleId);

  if (vehicle.state === "asleep") {
    console.log("Vehicle is asleep - aborting");
    return;
  }

  const chargeState = await getChargeState(vehicleId);
  const chargeStateCollection = await getChargeStateCollection();
  await chargeStateCollection.insertOne(chargeState);
};

(async () => {
  try {
    const vehicleList = await getVehicleList();

    if (vehicleList.length < 0) {
      return;
    }

    let vehicle = vehicleList[0];
    console.log(`Found vehicle: ${vehicle.display_name}`);

    setInterval(() => chargeLogic(vehicle.id_s), 1000 * 60 * 1); // execute start/stop charge logic every minute
    setInterval(() => dataCollection(vehicle.id_s), 1000 * 60 * 10); // execute data collection every 10 minutes
    setInterval(() => keepAlive(), 1000 * 60 * 20); // Keep alive ping every 20 minutes

    const server = createServer((req, res) => {
      res.statusCode = 204;
      res.end();
    });

    server.listen(process.env.PORT, () => {
      console.log("Charge my tesla is running!");
    });
  } catch (e) {
    console.error("App failed to start");
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
