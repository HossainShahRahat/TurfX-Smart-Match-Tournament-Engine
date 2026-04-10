import {
  emitMatchEvent,
  emitMatchState,
  emitPlayerStatUpdate,
} from "@/realtime/match-broadcaster";

export function publishMatchEvent(payload) {
  emitMatchEvent(payload);
}

export function publishMatchState(payload) {
  emitMatchState(payload);
}

export function publishPlayerStatUpdate(payload) {
  emitPlayerStatUpdate(payload);
}

