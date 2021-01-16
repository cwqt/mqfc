import { NowRequest, NowResponse } from '@vercel/node';

export default async (request:NowRequest, response:NowResponse) => {
  response.send(`
  <html>
    <h1 style="margin: 0px">mqfc</h1>
  </html>
  `)
}
