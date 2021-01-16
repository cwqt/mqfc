import { NowRequest, NowResponse } from '@vercel/node';
export type VercelFunction = (request: NowRequest) => Promise<any>;

export const handleRoute = (f: VercelFunction) => {
  return async (request: NowRequest, response: NowResponse) => {
    try {
      const ret = await f(request);
      response.json(ret);
    } catch (error) {
      console.log(error);
      response.status(500).json({ status: 'fail', message: error.message });
    }
  };
};
