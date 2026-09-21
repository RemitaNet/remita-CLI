const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const VendingService = require("../../services/Vending/vending-service");
const { printJson } = require("../../utils/output");
const { formatError } = require("../../utils/error");

function createValidateCommand() {
  const validate = new Command("validate");

  validate
    .description("Validate a vending account against a product")
    .requiredOption("--product-code <productCode>", "Product code")
    .requiredOption("--account-number <accountNumber>", "Account/meter number")
    .option("--dry-run", "Print the request payload without sending it")
    .action(async (options) => {
      try {
        const payload = {
          productCode: options.productCode,
          accountNumber: options.accountNumber,
        };

        if (options.dryRun) {
          printJson(payload);
          return;
        }

        const config = getConfig();
        const apiClient = new RemitaApiClient(config);
        const vendingService = new VendingService(apiClient);

        const result = await vendingService.validate(payload);

        printJson(result);
      } catch (error) {
        console.error(`Error: ${formatError(error)}`);
        process.exitCode = 1;
      }
    });

  return validate;
}

module.exports = createValidateCommand;