export interface ViewerAccount { id:string;email:string;isAdmin:boolean;profiles:Array<{id:string;name:string;avatar:string|null}> }
function apiBase(){const value=process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/,"");if(!value)throw new Error("The account service is not configured.");return value}
export function csrfToken(){return typeof document==="undefined"?"":document.cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("yt_anime_csrf="))?.split("=").slice(1).join("=")??""}
async function call<T>(path:string,init?:RequestInit){const response=await fetch(`${apiBase()}${path}`,{...init,credentials:"include",headers:{"Content-Type":"application/json",...(init?.method&&init.method!=="GET"?{"X-CSRF-Token":csrfToken()}:{}),...(init?.headers??{})}});const payload=await response.json().catch(()=>null) as (T&{error?:never})|{error?:{message?:string}}|null;if(!response.ok)throw new Error(payload?.error?.message??"The request failed.");return payload as T}
export function register(input:{name:string;email:string;password:string}){return call<{message:string}>("/api/v1/auth/register",{method:"POST",body:JSON.stringify(input)})}
export async function login(input:{email:string;password:string}){return (await call<{account:ViewerAccount}>("/api/v1/auth/login",{method:"POST",body:JSON.stringify(input)})).account}
export async function getViewer(){return (await call<{account:ViewerAccount}>("/api/v1/auth/me")).account}
export function verifyEmail(token:string){return call<{message:string}>("/api/v1/auth/verify-email",{method:"POST",body:JSON.stringify({token})})}
export function forgotPassword(email:string){return call<{message:string}>("/api/v1/auth/forgot-password",{method:"POST",body:JSON.stringify({email})})}
export function resetPassword(token:string,password:string){return call<{message:string}>("/api/v1/auth/reset-password",{method:"POST",body:JSON.stringify({token,password})})}
export async function logout(){await call<unknown>("/api/v1/auth/logout",{method:"POST"})}
