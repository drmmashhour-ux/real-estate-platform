import { describe, expect, it } from "vitest";
import { CSV_IMPORT_DEFAULT_PERMISSION, parseGrowthCsv } from "../csv-import";

describe("parseGrowthCsv", () => {
  it("parses header row and data rows", () => {
    const text = `name,email,phone,city,type
Jane,j@ex.com,555,Montreal,buyer`;
    const { rows, errors } = parseGrowthCsv(text);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "Jane",
      email: "j@ex.com",
      phone: "555",
      city: "Montreal",
      type: "buyer",
    });
  });

  it("defaults CSV import permission constant", () => {
    expect(CSV_IMPORT_DEFAULT_PERMISSION).toBe("granted_by_source");
  });
});
