import axios from "axios";
import { generateAuthorizationForPostRequest } from "../../utils/encryp";

export async function POST(request) {
  const data = await request.json();

  const authorization = generateAuthorizationForPostRequest({
    apiKey: process.env.NEXT_PUBLIC_IYZICO_API_KEY,
    secretKey: process.env.NEXT_PUBLIC_IYZICO_SECRET_KEY,
    data: JSON.stringify(data),
    uriPath: "/payment/iyzipos/checkoutform/initialize/auth/ecom",
  });

  const iyzipayBase = axios.create({
    baseURL: process.env.NEXT_PUBLIC_IYZICO_BASE_URL,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authorization,
    },
  });

  try {
    const response = await iyzipayBase.post(
      "payment/iyzipos/checkoutform/initialize/auth/ecom",
      data
    );
    return Response.json(response.data, { status: 200 });
  } catch (error) {
    console.log("err", error);
    return Response.json(error, { status: 500 });
  }
}
