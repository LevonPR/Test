export function toMarkdown(room) {
  const lines = [`# ${room.name}`, ''];
  if (room.topic) lines.push(`**Topic:** ${room.topic}`, '');
  if (room.agents.length) {
    lines.push('**Participants:**', '');
    for (const a of room.agents) {
      lines.push(`- **${a.name}** (${a.providerId}/${a.model})${a.persona ? ` — ${a.persona.replace(/\s+/g, ' ')}` : ''}`);
    }
    lines.push('');
  }
  lines.push('---', '');
  for (const m of room.messages) {
    if (!m.content) continue;
    const time = new Date(m.createdAt).toISOString().replace('T', ' ').slice(0, 19);
    if (m.authorType === 'system') {
      lines.push(`> _${m.content}_`, '');
    } else {
      lines.push(`**${m.authorName}** · ${time}`, '', m.content, '');
    }
  }
  return lines.join('\n');
}
