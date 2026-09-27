import assert from "node:assert/strict";
import test from "node:test";

import { episodeLabel, validateSearchQuery } from "./anime.js";

test("search validation mirrors the API limits", () => {
  assert.equal(validateSearchQuery("a"), "Enter at least two characters.");
  assert.equal(validateSearchQuery("x".repeat(121)), "Use 120 characters or fewer.");
  assert.equal(validateSearchQuery(" Naruto "), null);
});

test("episode labels use singular and plural wording", () => {
  assert.equal(episodeLabel(1), "1 episode");
  assert.equal(episodeLabel(2), "2 episodes");
  assert.equal(episodeLabel(null), null);
});
