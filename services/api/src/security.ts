import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
export const VERIFICATION_TTL_MS=60*60*1000;
export const RESET_TTL_MS=15*60*1000;
export function createOpaqueToken(){return randomBytes(32).toString("base64url")}
export function hashOpaqueToken(value:string){return createHash("sha256").update(value).digest("hex")}
export function sameToken(a:string|undefined,b:string|undefined){if(!a||!b)return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export function validCsrf(origin:string|undefined,expectedOrigin:string,cookie:string|undefined,header:string|undefined){return origin===expectedOrigin&&sameToken(cookie,header)}
