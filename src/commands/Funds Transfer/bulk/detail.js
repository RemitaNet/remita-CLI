const { Command } = require("commander");

const RemitaApiClient = require("../../../api/client");
const { getConfig } = require("../../../config/config-service");
const BulkDetailService = require("../../../services/Funds Transfer/bulk/bulk-details-service");
const { printJson } = require("../../../utils/output");

function createBulkDetailCommand() {
  const detail = new Command("detail");

  detail
    .description("Get details of a bulk fund transfer")
    .argument("<bulkReference>", "Bulk transaction reference")
    .action(async (bulkReference) => {
      try {
        const config = getConfig();

        const apiClient = new RemitaApiClient(config);
        const bulkDetailService = new BulkDetailService(apiClient);

        const result = await bulkDetailService.getDetail(bulkReference);

        printJson(result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });

  return detail;
}

module.exports = createBulkDetailCommand;