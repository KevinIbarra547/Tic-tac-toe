async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  try {
    const res = await fetch('/leaderboard');
    const { qualified, stillQualifyingCount } = await res.json();

    if (qualified.length === 0) {
      container.textContent = 'No players have completed 5+ games yet.';
    } else {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      ['Rank', 'Player', 'Record', 'Win Rate'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      qualified.forEach((player, i) => {
        const row = document.createElement('tr');
        const pct = Math.round(player.winRate * 100);
        [
          i + 1,
          player.username,
          `${player.wins}W / ${player.losses}L / ${player.draws}D`,
          `${pct}%`
        ].forEach(text => {
          const td = document.createElement('td');
          td.textContent = text;
          row.appendChild(td);
        });
        tbody.appendChild(row);
      });
      table.appendChild(tbody);

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
    const name = label.charAt(0).toUpperCase() + label.slice(1);
    if (data.games === 0) {
      p.textContent = `${name}: no data`;
    } else {
      const pct = Math.round(data.aiWinRate * 100);
      p.textContent = `${name}: ${pct}% AI win rate (${data.games} game${data.games !== 1 ? 's' : ''})`;
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
