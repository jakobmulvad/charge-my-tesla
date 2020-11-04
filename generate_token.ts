/* eslint-disable camelcase */
import Axios from 'axios';
import { ITeslaApiToken } from './types';

const authUrl = 'https://owner-api.teslamotors.com/oauth/token';
const client_secret = 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3';
const client_id = '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384';

export const generateToken = async (email: string, password: string) : Promise<ITeslaApiToken> => {
  const tokenResponse = await Axios.post<ITeslaApiToken>(authUrl, {
    email,
    password,
    client_secret,
    client_id,
    grant_type: 'password',
  });

  return tokenResponse.data;
};

export const refreshToken = async (refresh_token: string) : Promise<ITeslaApiToken> => {
  const tokenResponse = await Axios.post<ITeslaApiToken>(authUrl, {
    refresh_token,
    client_secret,
    client_id,
    grant_type: 'refresh_token',
  });

  return tokenResponse.data;
};
