import Axios from 'axios';
import { ITeslaApiToken } from './types';
import { getTokenCollection } from './db';

const authUrl = 'https://owner-api.teslamotors.com/oauth/token';
const client_secret = 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3';
const client_id = '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384';

export const getToken = async () : Promise<ITeslaApiToken> => {
  const collection = await getTokenCollection();
  const storedToken = await collection.findOne({});

  if (storedToken) {
    console.log('getToken: Using stored access token');
    return storedToken;
  }

  console.log('getToken: Generating new token');
  const tokenResponse = await Axios.post<ITeslaApiToken>(authUrl, {
    email: process.env.TESLA_ACCOUNT_EMAIL,
    password: process.env.TESLA_ACCOUNT_PASSWORD,
    client_secret,
    client_id,
    grant_type: 'password',
  });

  await collection.insertOne(tokenResponse.data);
  console.log('getToken: Storing generated token');

  return tokenResponse.data;
};

export const refreshToken = async (refreshToken: string) : Promise<ITeslaApiToken> => {
  const tokenResponse = await Axios.post<ITeslaApiToken>(authUrl, {
    refresh_token: refreshToken,
    client_secret,
    client_id,
    grant_type: 'refresh_token',
  });

  const collection = await getTokenCollection();
  await collection.deleteMany({});
  await collection.insertOne(tokenResponse.data);

  console.log('refreshToken: Storing refreshed token');

  return tokenResponse.data;
}