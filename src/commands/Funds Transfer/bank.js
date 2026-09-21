const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const BankService = require("../../services/Funds Transfer/bank-service");
const { printJson } = require("../../utils/output");

function createBanksCommand() {
  const banks = new Command("banks");

  banks.description("Bank-related operations");

  banks
    .command("list")
    .description("List available banks")
    .action(async () => {
      try {
        const config = getConfig();

        const apiClient = new RemitaApiClient(config);
        const bankService = new BankService(apiClient);

        const result = await bankService.listBanks();

        printJson(result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });

  return banks;
}

module.exports = createBanksCommand;