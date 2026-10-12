import { csvRow } from "./csv";

describe("csvRow", () => {
  it("quotes RFC4180 cells and blocks spreadsheet formulas", () => {
    expect(csvRow(["José, Ana", "=1+1", 'dice "sí"'])).toBe(
      '"José, Ana",\'=1+1,"dice ""sí"""\r\n',
    );
  });
});
