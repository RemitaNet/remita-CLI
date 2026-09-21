const { Command } = require("commander");

const RemitaApiClient = require("../../../api/client");
const { getConfig } = require("../../../config/config-service");
const BulkQueryService = require("../../../services/FTnds transfer/bulk/bulk-query-service");
const { printJson } = require("../../../utils/output");

function createBulkQueryCommand() {
  const query = new Command("query");

  query
    .description("Query a bulk fund transfer")
    .argument("<bulkReference>", "Bulk transaction reference")
    .action(async (bulkReference) => {
      try {
        const config = getConfig();

        const apiClient = new RemitaApiClient(config);
        const bulkQueryService = new BulkQueryService(apiClient);

        const result =
          await bulkQueryService.queryTransaction(bulkReference);

        printJson(result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });

  return query;
}

module.exports = createBulkQueryCommand;