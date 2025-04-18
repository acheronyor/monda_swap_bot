require("dotenv").config();
require("colors");
const readlineSync = require("readline-sync");
const { ethers } = require("ethers");
const fs = require("fs");
const displayHeader = require("./displayHeader");
const fetch = require("node-fetch");
const { tampilkanLeaderboardLengkap } = require("./leaderboard");
const walletAddress = process.env.WALLET_ADDRESS;

const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const MON_CONTRACT = ethers.ZeroAddress;
const WMON_CONTRACT = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
const USDC_CONTRACT = "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea";
const ROUTER_CONTRACT = "0xc80585f78A6e44fb46e1445006f820448840386e";

const routerABI = JSON.parse(fs.readFileSync("./abis/mondaRouter.json"));
const wmonABI = [
  "function deposit() payable",
  "function withdraw(uint wad)",
  "function approve(address guy, uint wad) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];
const erc20ABI = [
  "function approve(address guy, uint wad) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

const router = new ethers.Contract(ROUTER_CONTRACT, routerABI, wallet);
const wmon = new ethers.Contract(WMON_CONTRACT, wmonABI, wallet);
const usdc = new ethers.Contract(USDC_CONTRACT, erc20ABI, wallet);

let round = 1;

// Tanya jumlah swap di awal
let monSwapInput = readlineSync.question("Mau swap berapa MON? ");
let monSwapAmount = ethers.parseEther(monSwapInput);

async function approveIfNeeded(token, amount) {
  const allowance = await token.allowance(wallet.address, ROUTER_CONTRACT);
  if (allowance < amount) {
    console.log(`[INFO] Approving ${token.target} to ${ROUTER_CONTRACT}`.green);
    const tx = await token.approve(ROUTER_CONTRACT, ethers.MaxUint256);
    await tx.wait();
    console.log(`[INFO] Approved ${token.target}`.green);
  }
}

async function showBalance(label = "SALDO") {
  const monBal = await provider.getBalance(wallet.address);
  const wmonBal = await wmon.balanceOf(wallet.address);
  const usdcBal = await usdc.balanceOf(wallet.address);
  console.log(`[${label}] MON  : ${ethers.formatEther(monBal)} MON`.bold);
  console.log(`[${label}] WMON : ${ethers.formatEther(wmonBal)} WMON`.bold);
  console.log(`[${label}] USDC : ${ethers.formatUnits(usdcBal, 6)} USDC`.bold);
  console.log("======================================================".gray);
}

async function main() {
  displayHeader();
  await showBalance("SALDO AWAL");

  let initialData;
  let initialVolume = 0;

  // Dapatkan data leaderboard untuk mendapatkan total volume awal
  initialData = await tampilkanLeaderboardLengkap(walletAddress);
  if (initialData) {
    initialVolume = Number(initialData.totalVolume);
    console.log("======= Leaderboard Awal =======");
    console.log(`Username       : ${initialData.username}`);
    console.log(`Tier           : ${initialData.tier}`);
    console.log(`Total Volume   : ${initialData.totalVolume}`);
    console.log(`Total Liquidity: ${initialData.totalLiquidity}`);
    console.log(`Points         : ${initialData.points}`);
    console.log(`Streak         : ${initialData.streak}`);
    console.log(`Max Streak     : ${initialData.maxStreak}`);
    console.log(`Daily Volume   : ${initialData.dailyVolume}`);
    console.log(`Daily Swaps    : ${initialData.dailySwaps}`);
    console.log(`Daily Points   : ${initialData.dailyPoints}`);
    console.log(`Daily Streak   : ${initialData.dailyStreak}`);
    console.log("================================");
  }

  while (true) {
    console.log(`\n==================== ROUND ${round} ===================`.cyan);

    const monBalance = await provider.getBalance(wallet.address);
    const wmonBalance = await wmon.balanceOf(wallet.address);
    const usdcBalance = await usdc.balanceOf(wallet.address);

    if (monBalance < ethers.parseEther("0.0001") && wmonBalance.isZero() && usdcBalance.isZero()) {
      console.log("[DONE] Tidak ada saldo cukup untuk swap. Exit.".red);
      break;
    }

    try {
      // 1. Wrap jika ada MON cukup
      if (monBalance >= monSwapAmount) {
        const tx = await wmon.deposit({ value: monSwapAmount });
        await tx.wait();
        console.log(`[INFO] Wrapped ${ethers.formatEther(monSwapAmount)} MON to WMON`.green);
      }

      // 2. Swap WMON -> USDC
      const wmonBalNow = await wmon.balanceOf(wallet.address);
      if (wmonBalNow > 0) {
        await approveIfNeeded(wmon, wmonBalNow);
        const tx = await router.swapExactTokensForTokens(
          wmonBalNow,
          0,
          [WMON_CONTRACT, USDC_CONTRACT],
          wallet.address,
          Math.floor(Date.now() / 1000) + 60
        );
        const receipt = await tx.wait();
        console.log(`[SWAP] WMON -> USDC | Hash: ${receipt.hash}`.yellow);
      }

      // 3. Swap USDC -> WMON
      const usdcBalNow = await usdc.balanceOf(wallet.address);
      if (usdcBalNow > 0) {
        await approveIfNeeded(usdc, usdcBalNow);
        const tx = await router.swapExactTokensForTokens(
          usdcBalNow,
          0,
          [USDC_CONTRACT, WMON_CONTRACT],
          wallet.address,
          Math.floor(Date.now() / 1000) + 60
        );
        const receipt = await tx.wait();
        console.log(`[SWAP] USDC -> WMON | Hash: ${receipt.hash}`.yellow);
      }

      // 4. Unwrap WMON -> MON
      const wmonBalFinal = await wmon.balanceOf(wallet.address);
      if (wmonBalFinal > 0) {
        const tx = await wmon.withdraw(wmonBalFinal);
        await tx.wait();
        const monVal = ethers.formatEther(wmonBalFinal);
        console.log(`[INFO] Unwrapped ${monVal} WMON to MON`.green);
      }

      // 5. Tampilkan saldo setelah swap selesai
      await showBalance("SETELAH ROUND");

      // 6. Tampilkan informasi leaderboard terbaru
      const userData = await tampilkanLeaderboardLengkap(wallet.address);
      if (userData) {
        console.log("======= Leaderboard Info =======");
        console.log(`Username       : ${userData.username}`);
        console.log(`Tier           : ${userData.tier}`);
        console.log(`Total Volume   : ${userData.totalVolume}`);
        console.log(`Total Liquidity: ${userData.totalLiquidity}`);
        console.log(`Points         : ${userData.points}`);
        console.log(`Streak         : ${userData.streak}`);
        console.log(`Max Streak     : ${userData.maxStreak}`);
        console.log(`Daily Volume   : ${userData.dailyVolume}`);
        console.log(`Daily Swaps    : ${userData.dailySwaps}`);
        console.log(`Daily Points   : ${userData.dailyPoints}`);
        console.log(`Daily Streak   : ${userData.dailyStreak}`);
        console.log("================================");
      }

        // 7. Cek apakah volume harian sudah naik 10.5k dari awal
        const currentDailyVolume = Number(userData.dailyVolume);
        if (currentDailyVolume >= 10500) {
          console.log(
            "\n[PERINGATAN]".red +
            " Daily volume Anda sudah mencapai ".yellow +
            String(currentDailyVolume).green +
            " (>= 10500)".red
          );

          console.log("Jawaban: " + "y".green + " / " + "n".red);
          const lanjut = readlineSync.question("Apakah Anda ingin melanjutkan swap meskipun volume sudah tinggi? ".yellow);

          if (lanjut.toLowerCase() !== "y") {
            console.log("[INFO]".yellow + " Bot dihentikan karena Anda memilih untuk tidak melanjutkan swap dengan volume tinggi.".yellow);
            break;
          }
        }

      // 8. Cek apakah saldo mendekati nilai swap awal
      const monBalNow = await provider.getBalance(wallet.address);
      const warningThreshold = monSwapAmount + ethers.parseEther("0.9");

      if (monBalNow < warningThreshold && monBalNow > ethers.parseEther("0.0001")) {
        console.log(`[PERINGATAN] Saldo MON mendekati batas swap awal (${ethers.formatEther(monBalNow)} MON)`.red);
        const lanjut = readlineSync.question("Ingin lanjut dengan jumlah swap lebih kecil? (y/n): ");
        if (lanjut.toLowerCase() === "y") {
          const newAmount = readlineSync.question("Masukkan jumlah swap baru (MON): ");
          monSwapAmount = ethers.parseEther(newAmount);
          console.log(`[INFO] Swap akan dilanjutkan dengan ${newAmount} MON`.green);
        } else {
          console.log("[SELESAI] Bot berhenti karena swap tidak dilanjutkan.".yellow);
          break;
        }
      }

      round++;
      await new Promise((res) => setTimeout(res, 60_000));
    } catch (err) {
      console.log(`[ERROR] ${err.message}`.red);
      console.log("Menunggu 1 menit sebelum retry...\n".gray);
      await new Promise((res) => setTimeout(res, 60_000));
    }
  }
}

main();
