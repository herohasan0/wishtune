import CryptoJS from "crypto-js";
import { randomBytes } from "crypto";

/**
 * Generate a cryptographically secure random key
 * @returns {string} A random key string
 */
function generateSecureRandomKey() {
  // Use crypto.randomBytes (Node.js) - this runs server-side only
  return randomBytes(16).toString('hex');
}

export function generateAuthorizationForPostRequest({
  apiKey,
  secretKey,
  data,
  uriPath,
}) {
  // Generate a cryptographically secure random key instead of predictable timestamp
  const randomKey = generateSecureRandomKey();
  const uri_path = uriPath;
  const payload = randomKey + uri_path + data;
  const encryptedData = CryptoJS.HmacSHA256(payload, secretKey);
  const authorizationString =
    "apiKey:" +
    apiKey +
    "&randomKey:" +
    randomKey +
    "&signature:" +
    encryptedData;

  const base64EncodedAuthorization = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(authorizationString)
  );

  return "IYZWSv2 " + base64EncodedAuthorization;
}

export function generateAuthorizationForGetRequest({
  apiKey,
  secretKey,
  request,
}) {
  // Use cryptographically secure random key instead of hardcoded value
  const randomKey = generateSecureRandomKey();
  const startIndex = request.url.indexOf("/v2");
  const endIndex = request.url.indexOf("?");
  const uri_path = request.url.substring(startIndex, endIndex);
  let payload;
  if (!request.data) {
    payload = uri_path;
  } else {
    payload = uri_path + request.data;
  }
  const dataToEncrypt = randomKey + payload;
  const encryptedData = CryptoJS.HmacSHA256(dataToEncrypt, secretKey);
  const authorizationString =
    "apiKey:" +
    apiKey +
    "&randomKey:" +
    randomKey +
    "&signature:" +
    encryptedData;
  const base64EncodedAuthorization = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(authorizationString)
  );
  return "IYZWSv2 " + base64EncodedAuthorization;
}
