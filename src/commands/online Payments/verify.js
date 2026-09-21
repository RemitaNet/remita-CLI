const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const VerifyService = require("../../services/Online Payments/verify-service");
const { printJson } = require("../../utils/output");

function createVerifyCommand() {
  const verify = new Command("verify");

  verify
    .description("Verify a payment transaction")
    .argument("<transRef>", "Transaction reference")
    .action(async (transRef) => {
      try {
        const config = getConfig();

        const apiClient = new RemitaApiClient(config);
        const verifyService = new VerifyService(apiClient);

        const result = await verifyService.verify(transRef);

        printJson(result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });

  return verify;
}

module.exports = createVerifyCommand;