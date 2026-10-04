import assert from "node:assert/strict";
import test from "node:test";

import { loginPath, registerPath, safeNextPath } from "./navigation.js";

test("safeNextPath only permits local application paths", () => {
  assert.equal(safeNextPath("/anime/anime_1"), "/anime/anime_1");
  assert.equal(safeNextPath("https://evil.example"), "/");
  assert.equal(safeNextPath("//evil.example"), "/");
  assert.equal(safeNextPath(null), "/");
});

test("authentication links preserve the requested anime destination", () => {
  assert.equal(loginPath("/anime/anime_1"), "/login?next=%2Fanime%2Fanime_1&reason=signin_required");
  assert.equal(registerPath("/anime/anime_1"), "/register?next=%2Fanime%2Fanime_1");
});
