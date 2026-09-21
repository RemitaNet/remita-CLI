const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const NameEnquiryService = require("../../services/Funds Transfer/NameEnquiry-service");
const { printJson } = require("../../utils/output");

function createNameEnquiryCommand() {
  const nameEnquiry = new Command("name-enquiry");

  nameEnquiry
    .description("Enquire the account name for a bank account")
    .requiredOption("--destinationBankCode <bankCode>", "Destination bank code")
    .requiredOption(
      "--destinationAccountNumber <accountNumber>",
      "Destination account number"
    )
    .action(async (options) => {
      try {
        const config = getConfig();

        const apiClient = new RemitaApiClient(config);
        const nameEnquiryService = new NameEnquiryService(apiClient);

        const result = await nameEnquiryService.enquire(
          options.destinationBankCode,
          options.destinationAccountNumber
        );

        printJson(result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });

  return nameEnquiry;
}

module.exports = createNameEnquiryCommand;