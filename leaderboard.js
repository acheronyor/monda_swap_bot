// leaderboard.js
const fetch = require("node-fetch");

async function tampilkanLeaderboardLengkap(address) {
  try {
    const resUser = await fetch(`https://app.monda.fund/api/get-user?address=${address}`);
    if (!resUser.ok) throw new Error(`HTTP error user! status: ${resUser.status}`);
    const userData = await resUser.json();

    const resDaily = await fetch(`https://app.monda.fund/api/get-user-daily-stats?address=${address}`);
    if (!resDaily.ok) throw new Error(`HTTP error daily! status: ${resDaily.status}`);
    const dailyData = await resDaily.json();
    return {
      username: userData.username,
      tier: userData.tier,
      totalVolume: userData.totalVolume,
      totalLiquidity: userData.totalLiquidity,
      points: userData.points,
      streak: userData.streak,
      maxStreak: userData.maxStreak,
      dailyVolume: dailyData.volume || 0,
      dailySwaps: dailyData.swaps || 0,
      dailyPoints: dailyData.points || 0,
      dailyStreak: dailyData.streak || 0
    };
  } catch (error) {
    console.error("[ERROR] Gagal ambil leaderboard:", error.message);
    return null;
  }
}

module.exports = { tampilkanLeaderboardLengkap };
