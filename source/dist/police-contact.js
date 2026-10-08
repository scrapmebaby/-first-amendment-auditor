// Fictional encounter outcomes, not a model of real police procedure.
export function officerResponse(contact, roll = Math.random()) {
  if (contact.rounds >= 4) return null;
  contact.rounds++;
  if (contact.rounds >= 2 && roll < 0.08) {
    return {
      kind: 'force',
      damage: 45,
      auditor: 'Preserve that body camera. I want your supervisor here!',
      officer: 'I told you to back off! Put that camera down!',
      event: 'Officer punches and kicks the auditor during an excessive-force incident',
    };
  }
  if (roll < 0.3)
    return {
      kind: 'threat',
      damage: 0,
      auditor: 'Are you threatening me? I want your name and your supervisor!',
      officer: 'Keep running your mouth and I will find a reason to take you in!',
      event: 'Officer shouts a retaliatory threat at the auditor',
    };
  const rows = [
    [
      'Am I detained, or are you just interfering with my story?',
      'You are free to leave. Keep the walkway clear.',
    ],
    [
      'My viewers will decide whether you keep your badge.',
      'Your viewers do not run this department. What is your actual complaint?',
    ],
    [
      'I pay your salary. You answer to me.',
      'I answer for my conduct. I do not work as your camera crew.',
    ],
    [
      'I demand constitutional priority and immediate accountability.',
      'You can file a complaint. Inventing priority does not move you ahead of everyone else.',
    ],
    [
      'You sound nervous about independent oversight.',
      'I sound busy. Recording me is not a reason to threaten you.',
    ],
    [
      'Are you refusing to identify your authority?',
      'I have identified myself. Please stop talking over the answer.',
    ],
    [
      'Will you admit this is obstruction of journalism?',
      'No. I am asking you to give people room to pass.',
    ],
    [
      'I want an answer my audience can understand.',
      'Here it is: ask your question, then let me finish my answer.',
    ],
  ];
  const row = rows[Math.min(rows.length - 1, Math.floor(roll * rows.length))];
  return {
    kind: 'professional',
    damage: 0,
    auditor: row[0],
    officer: row[1],
    event: 'Auditor challenges an officer; officer responds without misconduct',
  };
}
export function supervisorFinding(report) {
  if (report.recordedForce && report.officerForce)
    return {
      substantiated: true,
      text: 'The recording shows excessive force. I am referring this officer for a disciplinary investigation and preserving the footage.',
    };
  if (report.recordedMisconduct && report.officerMisconduct)
    return {
      substantiated: true,
      text: 'That threat was improper. Your recorded complaint is referred for a conduct investigation.',
    };
  return {
    substantiated: false,
    text: 'I will log your complaint and review the accounts. Disagreeing with you does not by itself establish officer misconduct.',
  };
}
export function beginOfficerContact(state, id, report) {
  if (!state.officerHistory || state.officerHistory.day !== state.day)
    state.officerHistory = { day: state.day, counts: {} };
  return { id, day: state.day, rounds: state.officerHistory.counts[id] || 0, report };
}
export function rememberOfficerRound(state, contact) {
  state.officerHistory.counts[contact.id] = contact.rounds;
}
