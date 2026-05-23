// scripts/verify-queries.ts
import { config } from 'dotenv'
config({ path: '.env.local' })

import { searchPlayers, getPlayerHistory, getPlayerStats, getLeaderboard } from '../lib/queries'

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

    console.log(`\n=== getPlayerStats("${testName}") ===`)
    const stats = await getPlayerStats(testName)
    console.log(stats)
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
