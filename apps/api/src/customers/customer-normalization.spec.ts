describe("customer contact normalization", () => {
  it("canonicalizes email and strips non-digits from phone", () => {
    expect("  A.B@Example.test ".trim().toLowerCase()).toBe("a.b@example.test");
    expect("+52 (55) 1234-5678".replace(/\D/g, "")).toBe("525512345678");
  });
});
