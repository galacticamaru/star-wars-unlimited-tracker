import { describe, it, expect } from "vitest";
import { calculateLookingFor } from "./binder-logic";

describe("Trade Binder Logic", () => {
  describe("calculateLookingFor", () => {
    it("should return shortfall when only autoTarget is provided", () => {
      // Need 3, have 1, no manual, not excluded -> Looking for 2
      expect(calculateLookingFor(3, 0, 1, false)).toBe(2);
    });

    it("should return 0 when inventory meets or exceeds autoTarget", () => {
      // Need 3, have 3 -> Looking for 0
      expect(calculateLookingFor(3, 0, 3, false)).toBe(0);
      // Need 3, have 5 -> Looking for 0
      expect(calculateLookingFor(3, 0, 5, false)).toBe(0);
    });

    it("should prioritize higher manualTarget over autoTarget", () => {
      // Need 3 from decks, but want 5 manually. Have 1 -> Looking for 4
      expect(calculateLookingFor(3, 5, 1, false)).toBe(4);
    });

    it("should respect autoTarget if it is higher than manualTarget", () => {
      // Need 3 from decks, manual want is only 1. Have 0 -> Looking for 3
      expect(calculateLookingFor(3, 1, 0, false)).toBe(3);
    });

    it("should return 0 if the card is excluded, regardless of shortfall", () => {
      // Need 3, have 0, manual 5, but excluded -> Looking for 0
      expect(calculateLookingFor(3, 5, 0, true)).toBe(0);
    });

    it("should return shortfall when only manualTarget is provided", () => {
      // No decks, but want 2 manually. Have 0 -> Looking for 2
      expect(calculateLookingFor(0, 2, 0, false)).toBe(2);
    });

    it("should handle cases where everything is zero", () => {
      expect(calculateLookingFor(0, 0, 0, false)).toBe(0);
    });

    it("should not return negative values if inventory is high", () => {
      // Need 1, have 10 -> Looking for 0
      expect(calculateLookingFor(1, 1, 10, false)).toBe(0);
    });
  });
});
