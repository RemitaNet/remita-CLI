const { Command } = require("commander");

// require the vending commands
const createValidateCommand = require("./validate");
const createRequeryCommand = require("./requery");
const createProvidersCommand = require("./providers");
const createTransactionCommand = require("./transact");
const createProductsCommand = require("./products");

const createVendingCommand = () => {
  const vending = new Command("vending");

  vending.description("Remita vending (utilities and bills) operations");

  vending.addCommand(createValidateCommand());
  vending.addCommand(createRequeryCommand());
  vending.addCommand(createProvidersCommand());
  vending.addCommand(createTransactionCommand());
  vending.addCommand(createProductsCommand());

  return vending;
};

module.exports = createVendingCommand;