import {
  cn,
  roleLabel,
  roleAccent,
  statusClasses,
  formatElapsed,
  formatTimestamp,
} from "@/lib/utils";

describe("cn (classname utility)", () => {
  test("combines multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("filters out false values", () => {
    expect(cn("foo", false, "bar")).toBe("foo bar");
  });

  test("filters out null and undefined", () => {
    expect(cn("foo", null, undefined, "bar")).toBe("foo bar");
  });

  test("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });
});

describe("roleLabel", () => {
  test("has entries for all 7 roles", () => {
    expect(Object.keys(roleLabel)).toHaveLength(7);
  });

  test.each([
    ["pm", "PM"],
    ["architect", "Architect"],
    ["developer", "Developer"],
    ["reviewer", "Reviewer"],
    ["qa", "QA"],
    ["sre", "SRE"],
    ["cto", "CTO"],
  ] as const)("maps %s to %s", (role, label) => {
    expect(roleLabel[role]).toBe(label);
  });
});

describe("roleAccent", () => {
  test("has entries for all 7 roles", () => {
    expect(Object.keys(roleAccent)).toHaveLength(7);
  });

  test.each(["pm", "architect", "developer", "reviewer", "qa", "sre", "cto"] as const)(
    "role %s has bg, text, and ring classes",
    (role) => {
      const classes = roleAccent[role];
      expect(classes).toContain("bg-");
      expect(classes).toContain("text-");
      expect(classes).toContain("ring-");
    }
  );

  test("each role has unique accent", () => {
    const values = Object.values(roleAccent);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe("statusClasses", () => {
  test.each([
    ["completed", "emerald"],
    ["approved", "emerald"],
    ["passed", "emerald"],
    ["done", "emerald"],
  ])("status '%s' maps to emerald (success)", (status, expected) => {
    expect(statusClasses(status)).toContain(expected);
  });

  test.each([
    ["running", "blue"],
    ["recalling", "blue"],
    ["generating", "blue"],
    ["storing", "blue"],
  ])("status '%s' maps to blue (active)", (status, expected) => {
    expect(statusClasses(status)).toContain(expected);
  });

  test("warning maps to amber", () => {
    expect(statusClasses("warning")).toContain("amber");
  });

  test.each(["failed", "rejected", "error"])(
    "status '%s' maps to rose (error)",
    (status) => {
      expect(statusClasses(status)).toContain("rose");
    }
  );

  test("unknown status maps to slate (default)", () => {
    expect(statusClasses("unknown")).toContain("slate");
    expect(statusClasses("")).toContain("slate");
    expect(statusClasses("pending")).toContain("slate");
  });

  test("all return classes with bg-, text-, ring-", () => {
    const statuses = ["completed", "running", "warning", "failed", "idle"];
    for (const s of statuses) {
      const result = statusClasses(s);
      expect(result).toContain("bg-");
      expect(result).toContain("text-");
      expect(result).toContain("ring-");
    }
  });
});

describe("formatElapsed", () => {
  test("returns '--' for undefined", () => {
    expect(formatElapsed(undefined)).toBe("--");
  });

  test("returns '--' for null-like values", () => {
    // @ts-expect-error testing null input
    expect(formatElapsed(null)).toBe("--");
  });

  test("returns '0 ms' for zero (not '--')", () => {
    expect(formatElapsed(0)).toBe("0 ms");
  });

  test("returns milliseconds for < 1000", () => {
    expect(formatElapsed(500)).toBe("500 ms");
    expect(formatElapsed(1)).toBe("1 ms");
    expect(formatElapsed(999)).toBe("999 ms");
  });

  test("returns seconds for >= 1000", () => {
    expect(formatElapsed(1000)).toBe("1.0 s");
    expect(formatElapsed(1500)).toBe("1.5 s");
    expect(formatElapsed(2345)).toBe("2.3 s");
  });

  test("handles large values", () => {
    expect(formatElapsed(180000)).toBe("180.0 s");
  });
});

describe("formatTimestamp", () => {
  test("returns '--' for undefined", () => {
    expect(formatTimestamp(undefined)).toBe("--");
  });

  test("returns '--' for empty string", () => {
    expect(formatTimestamp("")).toBe("--");
  });

  test("formats valid ISO date", () => {
    const result = formatTimestamp("2026-04-04T10:30:00Z");
    expect(result).not.toBe("--");
    expect(result.length).toBeGreaterThan(5);
  });

  test("returns original string for invalid date", () => {
    expect(formatTimestamp("not-a-date")).toBe("not-a-date");
  });

  test("handles ISO date with timezone", () => {
    const result = formatTimestamp("2026-04-04T10:30:00-07:00");
    expect(result).not.toBe("--");
  });
});
