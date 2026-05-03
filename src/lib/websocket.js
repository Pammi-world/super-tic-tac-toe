// WebSocket server for online multiplayer
const WebSocket = require('ws');

function createWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, path: '/game' });
  const lobbies = new Map();
  
  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  wss.on('connection', (ws, req) => {
    ws.lobbyCode = null;
    ws.playerId = null;
    
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      
      if (msg.type === 'create_lobby') {
        const code = generateCode();
        lobbies.set(code, { host: ws, guest: null, game: null });
        ws.lobbyCode = code;
        ws.send(JSON.stringify({ type: 'lobby_created', code }));
      }
      
      else if (msg.type === 'join_lobby') {
        const lobby = lobbies.get(msg.code);
        if (lobby && !lobby.guest) {
          lobby.guest = ws;
          ws.lobbyCode = msg.code;
          lobby.host.send(JSON.stringify({ type: 'player_joined' }));
          ws.send(JSON.stringify({ type: 'joined' }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Lobby not found or full' }));
        }
      }
      
      else if (msg.type === 'move') {
        const lobby = lobbies.get(ws.lobbyCode);
        if (lobby) {
          const opponent = lobby.host === ws ? lobby.guest : lobby.host;
          if (opponent) {
            opponent.send(JSON.stringify({ type: 'opponent_move', ...msg }));
          }
        }
      }
    });
    
    ws.on('close', () => {
      if (ws.lobbyCode) {
        const lobby = lobbies.get(ws.lobbyCode);
        if (lobby) {
          const opponent = lobby.host === ws ? lobby.guest : lobby.host;
          if (opponent) opponent.send(JSON.stringify({ type: 'opponent_left' }));
          lobbies.delete(ws.lobbyCode);
        }
      }
    });
  });
  
  return wss;
}

module.exports = { createWebSocketServer };
