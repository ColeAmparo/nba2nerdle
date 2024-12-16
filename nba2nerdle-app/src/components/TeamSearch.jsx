import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { nbaRosters } from '../data/nbaRosters';

const TeamSearch = ({ onSelect, excludeTeams = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);

  const getStartYear = (teamKey) => {
    const yearMatch = teamKey.match(/^\d{4}/);
    return yearMatch ? parseInt(yearMatch[0]) : 0;
  };

  const filteredTeams = Object.keys(nbaRosters)
    .filter(team => {
      if (excludeTeams.includes(team)) return false;
      return team.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (/^\d{4}$/.test(searchTerm)) {
        const yearA = getStartYear(a);
        const yearB = getStartYear(b);
        const searchYear = parseInt(searchTerm);
        
        if (yearA === searchYear && yearB !== searchYear) return -1;
        if (yearB === searchYear && yearA !== searchYear) return 1;
      }
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
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200 dark:border-gray-700">
          {filteredTeams.length > 0 ? (
            filteredTeams.map((team, index) => (
              <div
                key={team}
                className={`px-4 py-2 cursor-pointer ${
                  index === selectedIndex 
                    ? 'bg-blue-100 dark:bg-gray-700' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleSelect(team)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {team}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No teams found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamSearch;