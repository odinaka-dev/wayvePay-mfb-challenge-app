import { transferSchema } from "@/lib/schema";

const valid = {
  recipientBankCode: "000001",
  recipientAccountNumber: "0123456789",
  amount: "2500.50",
  narration: "Rent",
};

function errorsFor(input: Partial<typeof valid>) {
  const result = transferSchema.safeParse({ ...valid, ...input });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
}

describe("transfer validation", () => {
  it("accepts a valid transfer", () => {
    expect(transferSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a bank", () => {
    expect(errorsFor({ recipientBankCode: "" }).recipientBankCode).toBe("Select a bank");
  });

  it.each(["123", "01234567890", "01234abcde", ""])("rejects account number %p", (accountNumber) => {
    expect(errorsFor({ recipientAccountNumber: accountNumber }).recipientAccountNumber).toBe(
      "Enter a 10 digit account number",
    );
  });

  it("requires an amount", () => {
    expect(errorsFor({ amount: "" }).amount).toBe("Enter an amount");
  });

  it("rejects more than two decimal places", () => {
    expect(errorsFor({ amount: "10.555" }).amount).toMatch(/up to 2 decimal places/);
  });

  it("rejects zero", () => {
    expect(errorsFor({ amount: "0" }).amount).toBe("Amount must be more than ₦0");
  });

  it("enforces the minimum and maximum transfer limits", () => {
    expect(errorsFor({ amount: "99.99" }).amount).toBe("The minimum transfer is ₦100.00");
    expect(errorsFor({ amount: "100" }).amount).toBeUndefined();
    expect(errorsFor({ amount: "5000000" }).amount).toBeUndefined();
    expect(errorsFor({ amount: "5000000.01" }).amount).toBe("The maximum transfer is ₦5,000,000.00");
  });

  it("limits the narration length", () => {
    expect(errorsFor({ narration: "x".repeat(101) }).narration).toMatch(/under 100/);
  });
});
