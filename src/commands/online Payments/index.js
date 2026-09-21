const { Command } = require("commander");

const createChargeCommand = require("./charge");
const createVerifyCommand = require("./verify");
function createOnlinePPaymentsCommand() {
  const onlinePayments = new Command("online-payments");

  onlinePayments
    .description("Remita online payments operations")
    .addCommand(createChargeCommand())
    .addCommand(createVerifyCommand());

  return onlinePayments;
}

module.exports = createOnlinePPaymentsCommand;