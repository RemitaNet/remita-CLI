#!/usr/bin/env node

const { Command } = require("commander");
const createFundsTransferCommand = require("./commands/Funds Transfer");
const createOnlinePaymentsCommand = require("./commands/online Payments");
const createAuthTokenCommand = require("./commands/Authentication");
const createVendingCommand = require("./commands/Vending");

const program = new Command();

program
  .name("remita")
  .description("Remita API command-line interface")
  .version("1.0.0");

program.addCommand(createFundsTransferCommand());
program.addCommand(createOnlinePaymentsCommand());
program.addCommand(createAuthTokenCommand());
program.addCommand(createVendingCommand());

program.parseAsync(process.argv);