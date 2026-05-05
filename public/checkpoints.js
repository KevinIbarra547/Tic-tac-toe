const FIELD_LABELS = {
  what_built: 'What I built',
  what_was_hard: 'What was hard',
  what_id_do_differently: "What I'd do differently",
  ai_usage: 'AI usage',
  ab_note: 'A/B note'
};

function renderReflection(r) {
  const article = document.createElement('article');

  const heading = document.createElement('h2');
  heading.textContent = `${r.checkpoint}: ${r.title}`;
  article.appendChild(heading);

  if (r.tag_url) {
    const link = document.createElement('p');
    const a = document.createElement('a');
    a.href = r.tag_url;
    a.textContent = 'View on GitHub';
    a.target = '_blank';
    link.appendChild(a);
    article.appendChild(link);
  }

  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const section = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = label;
    section.appendChild(h3);

    const p = document.createElement('p');
    const value = r[key];
    if (!value || value === 'TODO') {
      const em = document.createElement('em');
      em.textContent = 'Reflection not yet written.';
      p.appendChild(em);
    } else {
      p.textContent = value;
    }
    section.appendChild(p);
    article.appendChild(section);
  }

  return article;
}

async function loadReflections() {
  const container = document.getElementById('reflections-list');
  try {
    const res = await fetch('/reflections');
    const reflections = await res.json();
    container.innerHTML = '';
    if (reflections.length === 0) {
      container.textContent = 'No checkpoints yet.';
      return;
    }
    reflections.forEach(r => container.appendChild(renderReflection(r)));
  } catch (err) {
    container.textContent = 'Failed to load checkpoints.';
    console.error(err);
  }
}

loadReflections();
