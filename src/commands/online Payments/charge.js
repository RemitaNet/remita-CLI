const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const ChargeService = require("../../services/Online Payments/charge-service");
const { printJson } = require("../../utils/output");

function createChargeCommand() {
  const charge = new Command("charge");

  charge
    .description("Charge a payment")
    .requiredOption("--first-name <firstName>", "Payer first name")
    .requiredOption("--last-name <lastName>", "Payer last name")
    .requiredOption("--email <email>", "Payer email address")
    .requiredOption("--phone-number <phoneNumber>", "Payer phone number")
    .requiredOption(
      "--payment-identifier <paymentIdentifier>",
      "Payment identifier"
    )
    .requiredOption("--currency <currency>", "Payment currency")
    .requiredOption("--narration <narration>", "Payment narration")
    .requiredOption("--amount <amount>", "Payment amount")
    .action(async (options) => {
      try {
        const config = getConfig();

        const apiClient = new RemitaApiClient(config);
        const chargeService = new ChargeService(apiClient);

        const payload = {
          firstName: options.firstName,
          lastName: options.lastName,
          email: options.email,
          phoneNumber: options.phoneNumber,
          paymentIdentifier: options.paymentIdentifier,
          currency: options.currency,
          narration: options.narration,
          amount: options.amount,
        };

        const result = await chargeService.charge(payload);

        printJson(result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });

  return charge;
}

module.exports = createChargeCommand;