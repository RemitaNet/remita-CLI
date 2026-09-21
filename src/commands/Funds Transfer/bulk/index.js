const { Command } = require("commander");

// const createBulkTransferCommand = require("./transfer");
const createBulkQueryCommand = require("./query");
const createBulkDetailCommand = require("./detail");
const createBulkTransactionStatusCommand = require("./transaction-status");

function createBulkCommand() {
  const bulk = new Command("bulk");

  bulk
    .description("Bulk funds transfer operations")
    // .addCommand(createBulkTransferCommand())
    .addCommand(createBulkQueryCommand())
    .addCommand(createBulkDetailCommand())
    .addCommand(createBulkTransactionStatusCommand());

  return bulk;
}

module.exports = createBulkCommand;