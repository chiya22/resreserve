import { describe, expect, it } from "vitest";

import { seatingStyleAllowsZeroPartySize } from "./seating-style";

describe("seatingStyleAllowsZeroPartySize", () => {
  it("イベントの場合は true", () => {
    expect(seatingStyleAllowsZeroPartySize("event")).toBe(true);
  });

  it("立食・着席・弁当は false", () => {
    expect(seatingStyleAllowsZeroPartySize("standing")).toBe(false);
    expect(seatingStyleAllowsZeroPartySize("seated")).toBe(false);
    expect(seatingStyleAllowsZeroPartySize("bento")).toBe(false);
  });

  it("未指定は false", () => {
    expect(seatingStyleAllowsZeroPartySize(null)).toBe(false);
    expect(seatingStyleAllowsZeroPartySize(undefined)).toBe(false);
  });
});
