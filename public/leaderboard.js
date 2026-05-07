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

      const medals = ['🥇', '🥈', '🥉'];
      const tbody = document.createElement('tbody');
      qualified.forEach((player, i) => {
        const row = document.createElement('tr');
        const rank = i + 1;
        if (rank <= 3) row.classList.add(`rank-${rank}`);

        const pct = Math.round(player.winRate * 100);
        const rankDisplay = rank <= 3 ? medals[rank - 1] : String(rank);

        [rankDisplay, player.username, `${player.wins}W / ${player.losses}L / ${player.draws}D`].forEach(text => {
          const td = document.createElement('td');
          td.textContent = text;
          row.appendChild(td);
        });

        const winRateTd = document.createElement('td');
        winRateTd.className = 'win-rate-cell';
        const pctText = document.createElement('div');
        pctText.className = 'win-rate-pct';
        pctText.textContent = `${pct}%`;
        const barWrap = document.createElement('div');
        barWrap.className = 'win-rate-bar';
        const barFill = document.createElement('div');
        barFill.className = 'win-rate-bar-fill';
        barFill.style.width = `${pct}%`;
        barWrap.appendChild(barFill);
        winRateTd.appendChild(pctText);
        winRateTd.appendChild(barWrap);
        row.appendChild(winRateTd);

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
  const grid = document.createElement('div');
  grid.className = 'stat-card-grid';
  for (const [label, data] of Object.entries(buckets)) {
    const card = document.createElement('div');
    const name = label.charAt(0).toUpperCase() + label.slice(1);
    if (data.games === 0) {
      card.className = 'stat-card stat-card-empty';
      card.innerHTML =
        `<p class="stat-label">${name}</p>` +
        `<p class="stat-value">—</p>` +
        `<p class="stat-meta">no data</p>`;
    } else {
      const pct = Math.round(data.aiWinRate * 100);
      const highRate = data.aiWinRate > 0.5;
      card.className = 'stat-card';
      card.innerHTML =
        `<p class="stat-label">${name}</p>` +
        `<p class="stat-value${highRate ? ' stat-value-high' : ''}">${pct}%</p>` +
        `<p class="stat-meta">${data.games} game${data.games !== 1 ? 's' : ''}</p>`;
    }
    grid.appendChild(card);
  }
  container.appendChild(grid);
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
