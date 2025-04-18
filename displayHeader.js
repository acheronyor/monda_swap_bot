// displayHeader.js
require("colors");

function displayHeader() {
  process.stdout.write("\x1Bc"); // clear terminal
  console.log("=======================================".magenta);
  console.log("=       Monda Swap Bot MON/USDC       =".brightGreen);
  console.log("=         Created by ACHERON          =".brightGreen);
  console.log("=======================================".magenta);
  console.log();
}

module.exports = displayHeader;
