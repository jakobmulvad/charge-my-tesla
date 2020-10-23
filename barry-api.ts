import Axios from 'axios';

export interface Id {
  key: string;
  version: number;
}

export interface IBarryPricePoint {
  id: Id;
  created: Date;
  expired?: any;
  deleted?: any;
  author?: any;
  priceCode: string;
  value: number;
  start: Date;
  end: Date;
  country: string;
  spot: boolean;
}

export const getPrice = async (from: Date, to: Date) => {
  const response = await Axios.post('https://jsonrpc.barry.energy/json-rpc', {
    jsonrpc: '2.0',
    id: 0,
    method: 'co.getbarry.api.v1.OpenApiController.getPrice',
    params: [
      'DK_NORDPOOL_SPOT_DK1',
      from.toJSON(),
      to.toJSON(),
    ],
  }, {
    headers: {
      Authorization: `Bearer ${process.env.BARRY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(JSON.stringify(response.data, undefined, 2));
  return response.data;
};
