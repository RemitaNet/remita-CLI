const crypto = require("crypto");
const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const VendingService = require("../../services/vending/vending-service");
const { printJson } = require("../../utils/output");
const { formatError } = require("../../utils/error");

function generateClientReference() {
  return `VND${Date.now()}${crypto.randomInt(1000, 9999)}`;
}

function createTransactCommand() {
  const transact = new Command("transact");

  transact
    .description("Perform a vending transaction")
    .requiredOption("--product-code <productCode>", "Product code")
    .requiredOption("--amount <amount>", "Transaction amount")
    .requiredOption("--account-number <accountNumber>", "Account/meter number")
    .requiredOption("--phone-number <phoneNumber>", "Customer phone number")
    .option(
      "--client-reference <clientReference>",
      "Unique client reference (generated if omitted)"
    )
    .option("--skip-validation", "Skip the pre-transaction validate call")
    .option("--dry-run", "Print the request payload without sending it")
    .action(async (options) => {
      try {
        if (!/^\d+(\.\d{1,2})?$/.test(options.amount)) {
          transact.error(
            "error: --amount must be a positive number (max 2 decimal places)"
          );
        }

        const amount = Number(options.amount);

        if (amount <= 0) {
          transact.error("error: --amount must be greater than zero");
        }

        const clientReference =
          options.clientReference || generateClientReference();

        const payload = {
          productCode: options.productCode,
          clientReference,
          amount,
          data: {
            accountNumber: options.accountNumber,
            phoneNumber: options.phoneNumber,
          },
        };

        if (options.dryRun) {
          printJson(payload);
          return;
        }

        const config = getConfig();
        const apiClient = new RemitaApiClient(config);
        const vendingService = new VendingService(apiClient);

        if (!options.skipValidation) {
          const validation = await vendingService.validate({
            productCode: options.productCode,
            accountNumber: options.accountNumber,
          });

          const minAmount = validation?.data?.minAmount;

          if (typeof minAmount === "number" && amount < minAmount) {
            transact.error(
              `error: --amount ${amount} is below the minimum of ${minAmount} for this product`
            );
          }

          const maxAmount = validation?.data?.maxAmount;

          if (typeof maxAmount === "number" && amount > maxAmount) {
            transact.error(
              `error: --amount ${amount} exceeds the maximum of ${maxAmount} for this product`
            );
          }
        }

        const result = await vendingService.transact(payload);

        printJson(result);
      } catch (error) {
        console.error(`Error: ${formatError(error)}`);
        process.exitCode = 1;
      }
    });

  return transact;
}

module.exports = createTransactCommand;