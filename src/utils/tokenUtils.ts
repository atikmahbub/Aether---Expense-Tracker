export interface DecodedToken {
  exp: number;
  iat: number;
  [key: string]: any;
}

/**
 * Decodes a base64url string safely.
 */
const base64UrlDecode = (str: string): string | null => {
  try {
    // Add padding if necessary
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }

    // Manual decoding to avoid atob reliance in fragile environments
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";

    for (let i = 0; i < base64.length; i += 4) {
      const en1 = chars.indexOf(base64[i]);
      const en2 = chars.indexOf(base64[i + 1]);
      const en3 = chars.indexOf(base64[i + 2]);
      const en4 = chars.indexOf(base64[i + 3]);

      const chr1 = (en1 << 2) | (en2 >> 4);
      const chr2 = ((en2 & 15) << 4) | (en3 >> 2);
      const chr3 = ((en3 & 3) << 6) | en4;

      output += String.fromCharCode(chr1);
      if (en3 !== 64) output += String.fromCharCode(chr2);
      if (en4 !== 64) output += String.fromCharCode(chr3);
    }

    return decodeURIComponent(
      output
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (error) {
    return null;
  }
};

/**
 * Decodes a JWT token without validation.
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = base64UrlDecode(parts[1]);
    if (!payload) return null;

    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
};

/**
 * Checks if a token is expired or about to expire.
 */
export const isTokenExpired = (token: string | null, threshold = 60): boolean => {
  if (!token) return true;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp - currentTime < threshold;
};
