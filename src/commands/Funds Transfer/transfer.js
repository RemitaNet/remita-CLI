const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const TransferService = require("../../services/Funds Transfer/transfer-service");
const { printJson } = require("../../utils/output");

function createTransferCommand() {
  const transfer = new Command("transfer");

  transfer
    .description("Initiate a fund transfer")
    .requiredOption("--source-bank-code <sourceBankCode>", "Source bank code")
    .requiredOption(
      "--source-account-number <sourceAccountNumber>",
      "Source account number"
    )
    .requiredOption(
      "--source-account-name <sourceAccountName>",
      "Source account name"
    )
    .requiredOption(
      "--destination-account-number <destinationAccountNumber>",
      "Destination account number"
    )
    .requiredOption(
      "--destination-bank-code <destinationBankCode>",
      "Destination bank code"
    )
    .requiredOption(
      "--destination-account-name <destinationAccountName>",
      "Destination account name"
    )
    .requiredOption("--amount <amount>", "Transfer amount")
    .requiredOption(
      "--transaction-description <transactionDescription>",
      "Transaction description"
    )
    .requiredOption(
      "--payment-identifier <paymentIdentifier>",
      "Payment identifier"
    )
    .requiredOption("--channel <channel>", "Transaction channel")
    .option("--approval", "Mark transfer as an approval")
    .option("--pay-by-transfer", "Pay by transfer")
    .option("--fx", "Perform an FX transfer")
    .option(
      "--exchange-rate-reference <exchangeRateReference>",
      "FX exchange rate reference"
    )
    .option("--source-address <sourceAddress>", "FX source address")
    .option(
      "--destination-address <destinationAddress>",
      "FX destination address"
    )
    .option(
      "--transaction-purpose <transactionPurpose>",
      "FX transaction purpose"
    )
    .action(async (options) => {
      try {
        const config = getConfig();

        const apiClient = new RemitaApiClient(config);
        const transferService = new TransferService(apiClient);

        const payload = {
          sourceBankCode: options.sourceBankCode,
          sourceAccountNumber: options.sourceAccountNumber,
          sourceAccountName: options.sourceAccountName,
          destinationAccountNumber: options.destinationAccountNumber,
          destinationBankCode: options.destinationBankCode,
          destinationAccountName: options.destinationAccountName,
          amount: options.amount,
          transactionDescription: options.transactionDescription,
          paymentIdentifier: options.paymentIdentifier,
          channel: options.channel,
          isApproval: options.approval || false,
          payByTransfer: options.payByTransfer || false,
        };

        if (options.fx) {
          payload.fxTransaction = true;

          payload.fxTransfer = {
            exchangeRateReference: options.exchangeRateReference,
            sourceAddress: options.sourceAddress,
            destinationAddress: options.destinationAddress,
            transactionPurpose: options.transactionPurpose,
          };
        }

        const result = await transferService.transfer(payload);

        printJson(result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });

  return transfer;
}

module.exports = createTransferCommand;