import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CatalogueManager from "./catalogue-manager";

export const dynamic = "force-dynamic";

export default async function ManagePage(){
 const api=process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/,"");
 if(!api) throw new Error("The account service is not configured.");
 const cookie=(await cookies()).toString();
 const response=await fetch(`${api}/api/v1/auth/me`,{headers:{cookie},cache:"no-store"});
 if(response.status===401)redirect("/login?next=/manage");
 if(!response.ok)throw new Error("Unable to verify catalogue-manager access.");
 const payload=await response.json() as {account:{email:string;isAdmin:boolean}};
 if(!payload.account.isAdmin)redirect("/");
 return <CatalogueManager email={payload.account.email}/>;
}