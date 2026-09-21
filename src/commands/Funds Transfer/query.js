const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const QueryService = require("../../services/funds transfer/query-service");
const { printJson } = require("../../utils/output");

function createQueryCommand() {
  const query = new Command("query");

  query
    .description("Query a fund transfer transaction")
    .argument("<paymentIdentifier>", "Payment identifier")
    .action(async (paymentIdentifier) => {
      try {
        const config = getConfig();

        const apiClient = new RemitaApiClient(config);
        const queryService = new QueryService(apiClient);

        const result =
          await queryService.queryTransaction(paymentIdentifier);

        printJson(result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });

  return query;
}

module.exports = createQueryCommand;