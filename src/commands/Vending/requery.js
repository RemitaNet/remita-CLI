const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const VendingService = require("../../services/Vending/vending-service");
const { printJson } = require("../../utils/output");
const { formatError } = require("../../utils/error");

function createRequeryCommand() {
  const requery = new Command("requery");

  requery
    .description("Requery a vending transaction by client reference")
    .argument("<clientReference>", "The client reference used for the transaction")
    .action(async (clientReference) => {
      try {
        const config = getConfig();
        const apiClient = new RemitaApiClient(config);
        const vendingService = new VendingService(apiClient);

        const result = await vendingService.queryTransaction(clientReference);

        printJson(result);
      } catch (error) {
        console.error(`Error: ${formatError(error)}`);
        process.exitCode = 1;
      }
    });

  return requery;
}

module.exports = createRequeryCommand;