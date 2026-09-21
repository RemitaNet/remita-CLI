const { Command } = require("commander");

const RemitaApiClient = require("../../../api/client");
const { getConfig } = require("../../../config/config-service");
const BulkTransactionStatusService = require("../../../services/funds transfer/bulk/bulk-transaction-status-service");
const { printJson } = require("../../../utils/output");

function createBulkTransactionStatusCommand() {
  const transactionStatus = new Command("transaction-status");

  transactionStatus
    .description("Get the status of a transaction inside a bulk transfer")
    .argument("<bulkReference>", "Bulk transaction reference")
    .argument("<transactionReference>", "Transaction reference")
    .action(async (bulkReference, transactionReference) => {
      try {
        const config = getConfig();

        const apiClient = new RemitaApiClient(config);
        const transactionStatusService =
          new BulkTransactionStatusService(apiClient);

        const result = await transactionStatusService.getStatus(
          bulkReference,
          transactionReference
        );

        printJson(result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });

  return transactionStatus;
}

module.exports = createBulkTransactionStatusCommand;