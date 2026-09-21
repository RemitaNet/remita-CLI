const {Command} = require('commander');

const createtokencommand = require('./token');

function createAuthTokenCommand(){
    const authToken = new Command('Generate-Auth-Token');
    authToken.addCommand(createtokencommand());
    return authToken;
}

module.exports = createAuthTokenCommand;