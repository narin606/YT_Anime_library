import assert from "node:assert/strict";
import test from "node:test";

import { isMalformedJsonError } from "./requestErrors.js";

test("only Express JSON parse failures are classified as malformed requests", () => {
  assert.equal(isMalformedJsonError(Object.assign(new SyntaxError("bad json"), { status: 400, type: "entity.parse.failed" })), true);
  assert.equal(isMalformedJsonError(new SyntaxError("application bug")), false);
  assert.equal(isMalformedJsonError({ status: 500, type: "entity.parse.failed" }), false);
});
