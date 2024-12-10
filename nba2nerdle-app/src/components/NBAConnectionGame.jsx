// NBAConnectionGame.js
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Star, Search } from 'lucide-react';
import { nbaRosters } from '../data/nbaRosters';


const TeamSearch = ({ onSelect, excludeTeams = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);

  // Helper function to get the starting year from a team key
  const getStartYear = (teamKey) => {
    const yearMatch = teamKey.match(/^\d{4}/);
    return yearMatch ? parseInt(yearMatch[0]) : 0;
  };

  const filteredTeams = Object.keys(nbaRosters)
    .filter(team => !excludeTeams.includes(team))
    .filter(team => 
      team.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // If search term is a year, prioritize teams that start with that year
      if (/^\d{4}$/.test(searchTerm)) {
        const yearA = getStartYear(a);
        const yearB = getStartYear(b);
        const searchYear = parseInt(searchTerm);
        
        // If one team starts with the search year and the other doesn't,
        // prioritize the one that does
        if (yearA === searchYear && yearB !== searchYear) return -1;
        if (yearB === searchYear && yearA !== searchYear) return 1;
      }
      
      // Otherwise, sort by year (newest first)
      return getStartYear(b) - getStartYear(a);
    });

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredTeams.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selectedTeam = filteredTeams[selectedIndex];
      if (selectedTeam) {
        onSelect(selectedTeam);
        setSearchTerm('');
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelect = (team) => {
    onSelect(team);
    setSearchTerm('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a team (e.g., '2021 - 2022 Warriors')"
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      </div>

      {showSuggestions && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
          {filteredTeams.length > 0 ? (
            filteredTeams.map((team, index) => (
              <div
                key={team}
                className={`px-4 py-2 cursor-pointer ${
                  index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleSelect(team)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {team}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">No teams found</div>
          )}
        </div>
      )}
    </div>
  );
};

const NBAConnectionGame = () => {
  const [timeRemaining, setTimeRemaining] = useState(30);
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

  const findCommonPlayers = (team1, team2) => {
    if (!nbaRosters[team1] || !nbaRosters[team2]) return [];
    const common = nbaRosters[team1].filter(player => nbaRosters[team2].includes(player));
    return common.map(player => ({
      name: player,
      strikes: gameState.playerStrikes[player] || 0
    }));
  };

  const handleTeamSubmit = (selectedTeam) => {
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

    const lastTeam = gameState.previousTeams[gameState.previousTeams.length - 1];
    const commonPlayers = findCommonPlayers(lastTeam, selectedTeam);
    const usableCommonPlayers = commonPlayers.filter(player => player.strikes < 3);

    if (usableCommonPlayers.length > 0) {
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
    } else {
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        winner: prev.currentPlayer === 1 ? 2 : 1,
        message: commonPlayers.length === 0 
          ? `Player ${prev.currentPlayer} loses! No common players found.`
          : `Player ${prev.currentPlayer} loses! All common players have 3 strikes.`
      }));
    }
  };

  const resetGame = () => {
    setTimeRemaining(30);
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
          {/* Active Player Strikes */}
          {Object.keys(gameState.playerStrikes).length > 0 && (
            <div className="mb-4 bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
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
                        <Star key={i} className="text-gray-300" size={16} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Timer and Turn Info */}
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

          {/* Current Connections */}
          {gameState.currentConnections && !gameState.gameOver && (
            <div className="bg-blue-100 p-2 rounded mb-4">
              <div className="font-bold mb-2">Common Players:</div>
              {gameState.currentConnections.map((connection, index) => (
                <div key={index} className="flex items-center justify-between mb-1">
                  <span>{connection.name}</span>
                  <div className="flex">
                    {[...Array(connection.strikes)].map((_, i) => (
                      <Star key={i} className="text-yellow-500 fill-yellow-500" size={16} />
                    ))}
                    {[...Array(3 - connection.strikes)].map((_, i) => (
                      <Star key={i} className="text-gray-300" size={16} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Team History */}
          {gameState.previousTeams.length > 0 && (
            <div className="mb-4">
              <p className="font-bold">Team History:</p>
              {gameState.previousTeams.join(' → ')}
            </div>
          )}

          {/* Game Message */}
          <div className="mb-4 text-center font-semibold">
            {gameState.message}
          </div>

          {/* Game Controls */}
          {!gameState.gameOver && (
            <TeamSearch 
              onSelect={handleTeamSubmit}
              excludeTeams={gameState.previousTeams}
            />
          )}

          {/* Game Over Screen */}
          {gameState.gameOver && (
            <div className="text-center">
              <p className="text-xl font-bold mb-4">
                {gameState.message}
              </p>
              <div className="bg-gray-100 p-2 rounded mb-4">
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