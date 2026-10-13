import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("authenticated anime details do not hardcode a sign-in link", () => {
  const source = readFileSync(new URL("../app/anime/[id]/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /href="\/login"/);
  assert.match(source, /<DetailNavigation\s*\/>/);
});
