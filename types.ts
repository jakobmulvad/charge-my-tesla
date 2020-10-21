export interface ITeslaApiToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  created_at: number;
}

export type TeslaVehicleState = 'asleep' | 'online';

export type TeslaChargePortLatchState = 'Engaged';

export type TeslaChargingState = 'Stopped' | 'Disconnected' | "Complete" | "Charging";

export interface ITeslaApiResponse<T> {
  response: T;
}

export interface ITeslaVehicle  {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  option_codes: string;
  color?: any;
  tokens: string[];
  state: TeslaVehicleState;
  in_service: any;
  id_s: string;
  calendar_enabled: boolean;
  backseat_token?: any;
  backseat_token_updated_at?: any;
}

export interface ITeslaChargeState {
  charging_state: TeslaChargingState;
  fast_charger_type: string;
  fast_charger_brand: string;
  charge_limit_soc: number;
  charge_limit_soc_std: number;
  charge_limit_soc_min: number;
  charge_limit_soc_max: number;
  charge_to_max_range: boolean;
  max_range_charge_counter: number;
  fast_charger_present: boolean;
  battery_range: number;
  est_battery_range: number;
  ideal_battery_range: number;
  battery_level: number;
  usable_battery_level: number;
  charge_energy_added: number;
  charge_miles_added_rated: number;
  charge_miles_added_ideal: number;
  charger_voltage: number;
  charger_pilot_current: number;
  charger_actual_current: number;
  charger_power: number;
  time_to_full_charge: number;
  trip_charging: boolean;
  charge_rate: number;
  charge_port_door_open: boolean;
  conn_charge_cable: string;
  scheduled_charging_start_time?: any;
  scheduled_charging_pending: boolean;
  user_charge_enable_request?: any;
  charge_enable_request: boolean;
  charger_phases?: any;
  charge_port_latch: TeslaChargePortLatchState;
  charge_current_request: number;
  charge_current_request_max: number;
  managed_charging_active: boolean;
  managed_charging_user_canceled: boolean;
  managed_charging_start_time?: any;
  battery_heater_on: boolean;
  not_enough_power_to_heat: boolean;
  timestamp: number;
}

export interface ITeslaClimateState {
  battery_heater: boolean;
  battery_heater_no_power: boolean;
  climate_keeper_mode: string;
  driver_temp_setting: number;
  fan_status: number;
  inside_temp: number;
  is_auto_conditioning_on: boolean;
  is_climate_on: boolean;
  is_front_defroster_on: boolean;
  is_preconditioning: boolean;
  is_rear_defroster_on: boolean;
  left_temp_direction: number;
  max_avail_temp: number;
  min_avail_temp: number;
  outside_temp: number;
  passenger_temp_setting: number;
  remote_heater_control_enabled: boolean;
  right_temp_direction: number;
  seat_heater_left: number;
  seat_heater_rear_left: number;
  seat_heater_rear_right: number;
  seat_heater_right: number;
  seat_heater_third_row_left: number;
  seat_heater_third_row_right: number;
  side_mirror_heaters: boolean;
  smart_preconditioning: boolean;
  steering_wheel_heater: boolean;
  timestamp: number;
  wiper_blade_heater: boolean;
}

export interface ITeslaDriveState {
  gps_as_of: number;
  heading: number;
  latitude: number;
  longitude: number;
  native_latitude: number;
  native_location_supported: number;
  native_longitude: number;
  native_type: string;
  power?: any;
  shift_state?: any;
  speed?: any;
  timestamp: number;
}

export interface ITeslaGuiSettings {
  gui_24_hour_time: boolean;
  gui_charge_rate_units: string;
  gui_distance_units: string;
  gui_range_display: string;
  gui_temperature_units: string;
  timestamp: number;
}

export interface ITeslaVehicleData {
  can_accept_navigation_requests: boolean;
  can_actuate_trunks: boolean;
  car_special_type: string;
  car_type: string;
  charge_port_type: string;
  eu_vehicle: boolean;
  exterior_color: string;
  has_air_suspension: boolean;
  has_ludicrous_mode: boolean;
  motorized_charge_port: boolean;
  perf_config: string;
  plg: boolean;
  rear_seat_heaters: number;
  rear_seat_type: number;
  rhd: boolean;
  roof_color: string;
  seat_type: number;
  spoiler_type: string;
  sun_roof_installed: number;
  third_row_seats: string;
  timestamp: number;
  trim_badging: string;
  wheel_type: string;
}

export interface ITeslaMediaState {
  remote_control_enabled: boolean;
}

export interface ITeslaSoftwareUpdate {
  expected_duration_sec: number;
  status: string;
}

export interface ITeslaSpeedLimitMode {
  active: boolean;
  current_limit_mph: number;
  max_limit_mph: number;
  min_limit_mph: number;
  pin_code_set: boolean;
}

export interface ITeslaVehicleState {
  api_version: number;
  autopark_state_v2: string;
  autopark_style: string;
  calendar_supported: boolean;
  car_version: string;
  center_display_state: number;
  df: number;
  dr: number;
  ft: number;
  homelink_nearby: boolean;
  is_user_present: boolean;
  last_autopark_error: string;
  locked: boolean;
  media_state: ITeslaMediaState;
  notifications_supported: boolean;
  odometer: number;
  parsed_calendar_supported: boolean;
  pf: number;
  pr: number;
  remote_start: boolean;
  remote_start_enabled: boolean;
  remote_start_supported: boolean;
  rt: number;
  sentry_mode: boolean;
  software_update: ITeslaSoftwareUpdate;
  speed_limit_mode: ITeslaSpeedLimitMode;
  sun_roof_percent_open?: any;
  sun_roof_state: string;
  timestamp: number;
  valet_mode: boolean;
  vehicle_name: string;
}

export interface ITeslaVehicleConfig {
  id: number;
  user_id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  option_codes: string;
  color?: any;
  tokens: string[];
  state: string;
  in_service: boolean;
  id_s: string;
  calendar_enabled: boolean;
  api_version: number;
  backseat_token?: any;
  backseat_token_updated_at?: any;
  charge_state: ITeslaChargeState;
  climate_state: ITeslaClimateState;
  drive_state: ITeslaDriveState;
  gui_settings: ITeslaGuiSettings;
  vehicle_config: ITeslaVehicleConfig;
  vehicle_state: ITeslaVehicleState;
}

export interface IChargingSessionDocument {
  start: Date;
  lastUpdated: Date;
  powerConsumed: number;
  stop?: Date;
}
