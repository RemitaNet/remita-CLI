const { Command } = require("commander");

const createBanksCommand = require("./bank");
const createNameEnquiryCommand = require("./name-enquiry");
const createTransferCommand = require("./transfer");
const createQueryCommand = require("./query");
const createBulkCommand = require("./bulk");
function createFundsTransferCommand() {
  const fundsTransfer = new Command("funds-transfer");

  fundsTransfer
    .description("Remita funds transfer operations")
    .addCommand(createBanksCommand())
    .addCommand(createNameEnquiryCommand())
    .addCommand(createTransferCommand())
    .addCommand(createBulkCommand())
    .addCommand(createQueryCommand());

  return fundsTransfer;
}

module.exports = createFundsTransferCommand;