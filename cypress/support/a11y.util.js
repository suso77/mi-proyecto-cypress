// cypress/support/a11y.util.js

export function violationsToCsvRows(url, violations, maxNodesPerViolation = 2) {
  const rows = [];
  violations.forEach(v => {
    const nodes = v.nodes.slice(0, maxNodesPerViolation);
    nodes.forEach(n => {
      rows.push({
        url,
        id: v.id,
        impact: v.impact || '',
        description: v.description || '',
        help: v.help || '',
        helpUrl: v.helpUrl || '',
        selector: (n.target || []).join(' | '),
        html: n.html || '',
        failureSummary: n.failureSummary || '',
      });
    });
  });
  return rows;
}

export function violationsToMarkdown(url, violations, maxNodesPerViolation = 2) {
  const lines = [];
  lines.push(`## ${url}`);
  if (!violations.length) {
    lines.push('- ✅ Sin violaciones');
    return lines.join('\n');
  }
  violations.forEach(v => {
    lines.push(`- **${v.id}** (${v.impact || 'n/a'}): ${v.help}`);
    lines.push(`  - ${v.description}`);
    lines.push(`  - Ref: ${v.helpUrl}`);
    const nodes = v.nodes.slice(0, maxNodesPerViolation);
    nodes.forEach((n, i) => {
      lines.push(`  - Node ${i + 1}: \`${(n.target || []).join(' | ')}\``);
      if (n.failureSummary) lines.push(`    - ${n.failureSummary.replace(/\n/g, ' ')}`);
    });
  });
  return lines.join('\n');
}

