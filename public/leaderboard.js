async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  try {
    const res = await fetch('/leaderboard');
    const { qualified, stillQualifyingCount } = await res.json();

    if (qualified.length === 0) {
      container.textContent = 'No players have completed 5+ games yet.';
    } else {
      const table = document.createElement('table');
      const header = document.createElement('tr');
      header.innerHTML = '<th>Rank</th><th>Player</th><th>Record</th><th>Win Rate</th>';
      table.appendChild(header);
      qualified.forEach((player, i) => {
        const row = document.createElement('tr');
        const pct = Math.round(player.winRate * 100);
        row.innerHTML = `<td>${i + 1}</td><td>${player.username}</td><td>${player.wins}W / ${player.losses}L / ${player.draws}D</td><td>${pct}%</td>`;
        table.appendChild(row);
      });
      container.innerHTML = '';
      container.appendChild(table);
    }

    const note = document.createElement('p');
    note.textContent = `Still qualifying: ${stillQualifyingCount} player${stillQualifyingCount !== 1 ? 's' : ''} with fewer than 5 games.`;
    container.appendChild(note);
  } catch (err) {
    container.textContent = 'Failed to load leaderboard.';
    console.error(err);
  }
}

function renderStatBuckets(containerId, buckets) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (const [label, data] of Object.entries(buckets)) {
    const p = document.createElement('p');
    if (data.games === 0) {
      p.textContent = `${label.charAt(0).toUpperCase() + label.slice(1)}: no data`;
    } else {
      const pct = Math.round(data.aiWinRate * 100);
      p.textContent = `${label.charAt(0).toUpperCase() + label.slice(1)}: ${pct}% AI win rate (${data.games} game${data.games !== 1 ? 's' : ''})`;
    }
    container.appendChild(p);
  }
}

async function loadAiStats() {
  const diffContainer = document.getElementById('stats-difficulty');
  const persContainer = document.getElementById('stats-personality');
  try {
    const res = await fetch('/ai-stats');
    const { byDifficulty, byPersonality } = await res.json();
    renderStatBuckets('stats-difficulty', byDifficulty);
    renderStatBuckets('stats-personality', byPersonality);
  } catch (err) {
    diffContainer.textContent = 'Failed to load AI stats.';
    persContainer.textContent = '';
    console.error(err);
  }
}

loadLeaderboard();
loadAiStats();
