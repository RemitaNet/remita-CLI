const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const VendingService = require("../../services/vending/vending-service");
const { printJson } = require("../../utils/output");
const { formatError } = require("../../utils/error");

function createProvidersCommand() {
  const providers = new Command("providers");

  providers
    .description("List vending providers available for a category")
    .requiredOption("--category-id <categoryId>", "Category ID")
    .action(async (options) => {
      try {
        const config = getConfig();
        const apiClient = new RemitaApiClient(config);
        const vendingService = new VendingService(apiClient);

        const result = await vendingService.getProvidersByCategory(
          options.categoryId
        );

        printJson(result);
      } catch (error) {
        console.error(`Error: ${formatError(error)}`);
        process.exitCode = 1;
      }
    });

  return providers;
}

module.exports = createProvidersCommand;