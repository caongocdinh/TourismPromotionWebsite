// session.js
// Utility for session ID management

export function getSessionId() {
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}

export function resetSessionId() {
  const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem("sessionId", newSessionId);
  return newSessionId;
}
