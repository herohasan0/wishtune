import axios from "axios";
import { generateAuthorizationForPostRequest } from "../../utils/encryp";

export async function POST(request) {
  try {
    // Validate environment variables
    if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY || !process.env.IYZICO_BASE_URL) {
      console.error("❌ Missing Iyzico environment variables:", {
        hasApiKey: !!process.env.IYZICO_API_KEY,
        hasSecretKey: !!process.env.IYZICO_SECRET_KEY,
        hasBaseUrl: !!process.env.IYZICO_BASE_URL,
      });
      return Response.json(
        { 
          error: "Payment gateway configuration error",
          message: "Missing required Iyzico environment variables"
        },
        { status: 500 }
      );
    }

    const data = await request.json();

    const authorization = generateAuthorizationForPostRequest({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      data: JSON.stringify(data),
      uriPath: "/payment/iyzipos/checkoutform/initialize/auth/ecom",
    });

    const iyzipayBase = axios.create({
      baseURL: process.env.IYZICO_BASE_URL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authorization,
      },
    });

    const response = await iyzipayBase.post(
      "payment/iyzipos/checkoutform/initialize/auth/ecom",
      data
    );
    return Response.json(response.data, { status: 200 });
  } catch (error) {
    console.error("❌ Error initializing payment form:", error);
    
    // Extract meaningful error information
    const errorMessage = error.response?.data?.errorMessage || error.message || "Unknown error";
    const errorCode = error.response?.data?.errorCode || error.code || "UNKNOWN_ERROR";
    
    return Response.json(
      { 
        error: "Failed to initialize payment form",
        message: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
