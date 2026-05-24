// scripts/verify-queries.ts
import { config } from 'dotenv'
config({ path: '.env.local' })

import {
  searchPlayers,
  getPlayerHistory,
  getPlayerStats,
  getLeaderboard,
  getPlacementDistribution,
} from '../lib/queries'

async function main() {
  console.log('\n=== searchPlayers("a", limit=3) ===')
  const players = await searchPlayers('a', 3)
  console.log(`${players.length} rows`)
  if (players.length > 0) console.log('Sample:', players[0])

  const testName = players[0]?.player_name
  if (testName) {
    console.log(`\n=== getPlayerHistory("${testName}") ===`)
    const history = await getPlayerHistory(testName)
    console.log(`${history.length} rows`)
    if (history.length > 0) console.log('Sample:', history[0])

    console.log(`\n=== getPlayerStats("${testName}", season) ===`)
    const statsAll = await getPlayerStats(testName, 18, 'season')
    if (statsAll) console.log(statsAll)
    else console.log('null (no games in window)')

    console.log(`\n=== getPlayerStats("${testName}", 7d) ===`)
    const stats7d = await getPlayerStats(testName, 18, '7d')
    if (stats7d) console.log(stats7d)
    else console.log('null (no games in window)')

    console.log(`\n=== getPlacementDistribution("${testName}", season) ===`)
    const distAll = await getPlacementDistribution(testName, 18, 'season')
    console.log(`${distAll.length} placements`)
    if (distAll.length > 0) console.log('Sample:', distAll[0])

    console.log(`\n=== getPlacementDistribution("${testName}", 7d) ===`)
    const dist7d = await getPlacementDistribution(testName, 18, '7d')
    console.log(`${dist7d.length} placements`)
    if (dist7d.length > 0) console.log('Sample:', dist7d[0])
  }

  console.log('\n=== getLeaderboard(18, limit=3) ===')
  const board = await getLeaderboard(18, 3)
  console.log(`${board.length} rows`)
  if (board.length > 0) console.log('Sample:', board[0])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
