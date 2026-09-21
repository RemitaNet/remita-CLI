const { RemitaClient } = require("../src/Library");

// Known-good demo test data from the vending API docs
const TEST_CATEGORY_ID = "1"; // electricity
const TEST_PROVIDER = "ekedc";
const TEST_PRODUCT_CODE = "101"; // Eko Prepaid
const TEST_METER_NUMBER = "12345678910"; // Eko Prepaid test meter
const TEST_PHONE_NUMBER = "08064324179";
const TEST_AMOUNT = 3100;

async function main() {
  const remita = new RemitaClient({
    secretKey: process.env.REMITA_SECRETKEY,
  });

  const vending = remita.vending.service;

  const results = {};

  await step(results, "providers", () =>
    vending.getProvidersByCategory(TEST_CATEGORY_ID)
  );

  await step(results, "products", () =>
    vending.getProducts({
      categoryCode: "electricity",
      provider: TEST_PROVIDER,
    })
  );

  await step(results, "validate", () =>
    vending.validate({
      productCode: TEST_PRODUCT_CODE,
      accountNumber: TEST_METER_NUMBER,
    })
  );

  let clientReference;

  await step(results, "transact", async () => {
    clientReference = `LIBTEST${Date.now()}`;

    return vending.transact({
      productCode: TEST_PRODUCT_CODE,
      clientReference,
      amount: TEST_AMOUNT,
      data: {
        accountNumber: TEST_METER_NUMBER,
        phoneNumber: TEST_PHONE_NUMBER,
      },
    });
  });

  if (clientReference) {
    await step(results, "queryTransaction", () =>
      vending.queryTransaction(clientReference)
    );
  } else {
    console.log("\n--- queryTransaction ---");
    console.log("SKIPPED (no clientReference — transact failed or was never sent)");
  }

  printSummary(results);
}

async function step(results, label, fn) {
  console.log(`\n--- ${label} ---`);

  try {
    const result = await fn();
    console.log(JSON.stringify(result, null, 2));
    results[label] = { ok: true };
  } catch (error) {
    console.error(`FAILED: ${error.message}`);
    results[label] = { ok: false, error: error.message };
  }
}

function printSummary(results) {
  console.log("\n=== Summary ===");

  let anyFailed = false;

  for (const [label, outcome] of Object.entries(results)) {
    const status = outcome.ok ? "PASS" : "FAIL";
    console.log(`${status.padEnd(4)} ${label}`);

    if (!outcome.ok) {
      anyFailed = true;
    }
  }

  process.exitCode = anyFailed ? 1 : 0;
}

main().catch((error) => {
  console.error("Vending test script crashed:");
  console.error(error.message);
  process.exitCode = 1;
});