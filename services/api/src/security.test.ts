import assert from "node:assert/strict";
import test from "node:test";
import { createOpaqueToken,hashOpaqueToken,sameToken,validCsrf } from "./security.js";
test("opaque tokens are random and only deterministic digests are stored",()=>{const a=createOpaqueToken(),b=createOpaqueToken();assert.notEqual(a,b);assert.match(a,/^[A-Za-z0-9_-]{43}$/);assert.equal(hashOpaqueToken(a),hashOpaqueToken(a));assert.notEqual(hashOpaqueToken(a),a)});
test("CSRF requires matching origin and double-submit token",()=>{assert.equal(validCsrf("https://ani.kaehana.com","https://ani.kaehana.com","token","token"),true);assert.equal(validCsrf("https://evil.example","https://ani.kaehana.com","token","token"),false);assert.equal(sameToken("token","other"),false)});
