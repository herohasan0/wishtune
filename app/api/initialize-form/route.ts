import axios, { AxiosError } from "axios";
import { NextRequest } from "next/server";
import { generateAuthorizationForPostRequest } from "../../utils/encryp";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
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

    // Construct the request payload strictly according to Iyzico documentation
    // https://docs.iyzico.com/odeme-metotlari/odeme-formu/cf-entegrasyonu/cf-ornek-entegrasyon#adim-1-cf-baslatma
    const requestData = {
      locale: data.locale || "en",
      conversationId: data.conversationId,
      price: data.price.toString(),
      paidPrice: data.paidPrice.toString(),
      currency: data.currency || "USD",
      callbackUrl: data.callbackUrl,
      buyer: {
        id: data.buyer.id,
        name: data.buyer.name,
        surname: data.buyer.surname,
        gsmNumber: data.buyer.gsmNumber || "+905555555555", // Required field
        email: data.buyer.email,
        identityNumber: data.buyer.identityNumber || "11111111111", // Required field
        registrationAddress: data.buyer.registrationAddress,
        city: data.buyer.city,
        country: data.buyer.country,
      },
      shippingAddress: {
        contactName: data.shippingAddress.contactName,
        city: data.shippingAddress.city,
        country: data.shippingAddress.country,
        address: data.shippingAddress.address,
      },
      billingAddress: {
        contactName: data.billingAddress.contactName,
        city: data.billingAddress.city,
        country: data.billingAddress.country,
        address: data.billingAddress.address,
      },
      basketItems: data.basketItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        category1: item.category1 || "General",
        itemType: item.itemType || "VIRTUAL", // Default to VIRTUAL for credits
        price: item.price.toString(),
      })),
    };

    console.log("Initializing Iyzico Payment Form with data:", JSON.stringify(requestData, null, 2));

    const authorization = generateAuthorizationForPostRequest({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      data: JSON.stringify(requestData),
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
      requestData
    );

    // Persist payment session for resiliency against lost sessions/cookies
    if (response.data?.status === "success" && response.data?.token) {
      const token = response.data.token;
      try {
        await db.collection("paymentSessions").doc(token).set({
          userId: data.conversationId, // conversationId maps to userId in our logic
          conversationId: data.conversationId,
          createdAt: FieldValue.serverTimestamp(),
          locale: requestData.locale,
          price: requestData.price,
        });
        console.log(`✅ Persisted payment session for token: ${token}`);
      } catch (dbError) {
        console.error("❌ Failed to persist payment session:", dbError);
        // We don't block the response, but this is critical for fallback
      }
    }

    return Response.json(response.data, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ Error initializing payment form:", error);
    
    // Extract meaningful error information
    const errorMessage = (error as AxiosError<any>)?.response?.data?.errorMessage || (error as Error)?.message || "Unknown error";
    const errorCode = (error as AxiosError<any>)?.response?.data?.errorCode || (error as any)?.code || "UNKNOWN_ERROR";
    
    return Response.json(
      { 
        error: "Failed to initialize payment form",
        message: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === "development" ? (error as Error)?.stack : undefined
      },
      { status: 500 }
    );
  }
}
