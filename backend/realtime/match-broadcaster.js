function getSocketServer() {
  return global.__TURFX_IO__ || null;
}

function emitToMatchRoom(matchId, eventName, payload) {
  const io = getSocketServer();

  if (!io || !matchId) {
    return false;
  }

  io.to(matchId.toString()).emit(eventName, payload);
  return true;
}

export function emitMatchEvent(payload) {
  return emitToMatchRoom(payload.matchId, "match:event", payload);
}

export function emitMatchState(payload) {
  return emitToMatchRoom(payload.matchId, "match:state", payload);
}

export function emitPlayerStatUpdate(payload) {
  return emitToMatchRoom(payload.matchId, "player:updated", payload);
}
