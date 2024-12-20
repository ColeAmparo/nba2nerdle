import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Star } from 'lucide-react';
import { nbaRosters } from '../data/nbaRosters';
import TeamSearch from './TeamSearch';

const NBAConnectionGame = () => {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [errorMessage, setErrorMessage] = useState('');
  const [gameState, setGameState] = useState({
    currentPlayer: 1,
    previousTeams: [],
    message: 'Player 1: Choose your first team',
    gameOver: false,
    winner: null,
    roundCount: 0,
    currentConnections: null,
    playerStrikes: {}
  });

  useEffect(() => {
    let timerId;
    if (!gameState.gameOver && gameState.previousTeams.length > 0) {
      timerId = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setGameState(prevState => ({
              ...prevState,
              gameOver: true,
              winner: prevState.currentPlayer === 1 ? 2 : 1,
              message: `Player ${gameState.currentPlayer} ran out of time!`
            }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [gameState.gameOver, gameState.previousTeams, gameState.currentPlayer]);

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const getFranchise = (teamKey) => {
    const parts = teamKey.split(' - ');
    if (parts.length > 1) {
      return parts[1].split(' ').slice(1).join(' '); // Get just the team name, without the year
    }
    return teamKey.split(' ').slice(2).join(' '); // Fallback
  };

  const findCommonPlayers = (team1, team2) => {
    if (!nbaRosters[team1] || !nbaRosters[team2]) return [];
    const common = nbaRosters[team1].filter(player => nbaRosters[team2].includes(player));
    return common.map(player => ({
      name: player,
      strikes: gameState.playerStrikes[player] || 0
    }));
  };

  const handleTeamSubmit = (selectedTeam) => {
    // Check for same franchise
    if (gameState.previousTeams.length > 0) {
      const previousTeam = gameState.previousTeams[gameState.previousTeams.length - 1];
      const previousFranchise = getFranchise(previousTeam);
      const currentFranchise = getFranchise(selectedTeam);
      
      if (previousFranchise === currentFranchise) {
        showError(`Cannot select ${currentFranchise} - same franchise as previous team`);
        return;
      }
    }

    // First round handling
    if (gameState.previousTeams.length === 0) {
      setGameState(prev => ({
        ...prev,
        previousTeams: [selectedTeam],
        currentPlayer: 2,
        message: 'Player 2: Choose a team with common players',
        roundCount: 1,
        currentConnections: null
      }));
      setTimeRemaining(30);
      return;
    }

    // Find common players
    const lastTeam = gameState.previousTeams[gameState.previousTeams.length - 1];
    const commonPlayers = findCommonPlayers(lastTeam, selectedTeam);

    // Check if there are any common players
    if (commonPlayers.length === 0) {
      showError('Invalid selection: No common players between teams');
      return;
    }

    // Check for players with 3 strikes
    const usableCommonPlayers = commonPlayers.filter(player => player.strikes < 3);
    if (usableCommonPlayers.length === 0) {
      showError('Invalid selection: All common players have reached 3 strikes');
      return;
    }

    // Valid move - update game state
    const updatedStrikes = { ...gameState.playerStrikes };
    usableCommonPlayers.forEach(player => {
      updatedStrikes[player.name] = (updatedStrikes[player.name] || 0) + 1;
    });

    setGameState(prev => ({
      ...prev,
      previousTeams: [...prev.previousTeams, selectedTeam],
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
      message: `Player ${prev.currentPlayer === 1 ? 2 : 1}: Choose a team with common players`,
      roundCount: prev.roundCount + 1,
      currentConnections: usableCommonPlayers.map(player => ({
        ...player,
        strikes: updatedStrikes[player.name]
      })),
      playerStrikes: updatedStrikes
    }));
    setTimeRemaining(30);
  };

  const resetGame = () => {
    setTimeRemaining(30);
    setErrorMessage('');
    setGameState({
      currentPlayer: 1,
      previousTeams: [],
      message: 'Player 1: Choose your first team',
      gameOver: false,
      winner: null,
      roundCount: 0,
      currentConnections: null,
      playerStrikes: {}
    });
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>NBA Roster Connection Game</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-2 rounded">
              {errorMessage}
            </div>
          )}

          {Object.keys(gameState.playerStrikes).length > 0 && (
            <div className="mb-4 bg-gray-100 dark:bg-gray-800 p-2 rounded max-h-40 overflow-y-auto">
              <strong>Player Strikes:</strong>
              {Object.entries(gameState.playerStrikes)
                .sort((a, b) => b[1] - a[1])
                .map(([player, strikes]) => (
                  <div key={player} className="flex items-center justify-between">
                    <span className="mr-2">{player}</span>
                    <div className="flex">
                      {[...Array(strikes)].map((_, i) => (
                        <Star key={i} className="text-red-500 fill-red-500" size={16} />
                      ))}
                      {[...Array(3 - strikes)].map((_, i) => (
                        <Star key={i} className="text-gray-300 dark:text-gray-600" size={16} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {!gameState.gameOver && gameState.previousTeams.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <Clock className="mr-2" />
                <span>{timeRemaining} seconds</span>
              </div>
              <div>
                <span>Player {gameState.currentPlayer}'s Turn</span>
              </div>
            </div>
          )}

          {gameState.currentConnections && !gameState.gameOver && (
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4">
              <div className="font-bold mb-2">Common Players:</div>
              {gameState.currentConnections.map((connection, index) => (
                <div key={index} className="flex items-center justify-between mb-1">
                  <span>{connection.name}</span>
                  <div className="flex">
                    {[...Array(connection.strikes)].map((_, i) => (
                      <Star key={i} className="text-yellow-500 fill-yellow-500" size={16} />
                    ))}
                    {[...Array(3 - connection.strikes)].map((_, i) => (
                      <Star key={i} className="text-gray-300 dark:text-gray-600" size={16} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {gameState.previousTeams.length > 0 && (
            <div className="mb-4">
              <p className="font-bold">Team History:</p>
              {gameState.previousTeams.join(' → ')}
            </div>
          )}

          <div className="mb-4 text-center font-semibold">
            {gameState.message}
          </div>

          {!gameState.gameOver && (
            <TeamSearch 
              onSelect={handleTeamSubmit}
              excludeTeams={gameState.previousTeams}
            />
          )}

          {gameState.gameOver && (
            <div className="text-center">
              <p className="text-xl font-bold mb-4">
                {gameState.message}
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4">
                <strong>Rounds Played:</strong> {gameState.roundCount}
                <br />
                <strong>Teams Used:</strong> {gameState.previousTeams.join(', ')}
                <br />
                <strong>Final Player Strikes:</strong>
                {Object.entries(gameState.playerStrikes)
                  .sort((a, b) => b[1] - a[1])
                  .map(([player, strikes]) => (
                    <div key={player}>
                      {player}: {strikes} strikes
                    </div>
                  ))}
              </div>
              <Button 
                onClick={resetGame} 
                className="mt-4 w-full"
              >
                Play Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NBAConnectionGame;