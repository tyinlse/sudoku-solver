import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Grid, Eraser, Info, BookOpen } from 'lucide-react';

const App = () => {
  const [gridSize, setGridSize] = useState(5); // Default to 5x5 as per image
  const [board, setBoard] = useState(Array(5).fill().map(() => Array(5).fill('')));
  const [status, setStatus] = useState('idle'); // idle, solved, unsolvable, error
  const [initialMap, setInitialMap] = useState(new Set()); // To track which cells were user-inputted

  // Reset board when size changes
  useEffect(() => {
    resetBoard(gridSize);
  }, [gridSize]);

  const resetBoard = (size) => {
    setBoard(Array(size).fill().map(() => Array(size).fill('')));
    setStatus('idle');
    setInitialMap(new Set());
  };

  const handleInputChange = (row, col, value) => {
    // Only allow numbers 1-gridSize or empty
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= gridSize)) {
      const newBoard = [...board];
      newBoard[row] = [...newBoard[row]];
      newBoard[row][col] = value;
      setBoard(newBoard);
      setStatus('idle');
    }
  };

  // --- Solver Logic ---

  const isValid = (currentBoard, row, col, num, size) => {
    const numStr = num.toString();

    // Check Row
    for (let x = 0; x < size; x++) {
      if (currentBoard[row][x] === numStr && x !== col) return false;
    }

    // Check Column
    for (let x = 0; x < size; x++) {
      if (currentBoard[x][col] === numStr && x !== row) return false;
    }

    // Check Box (Only for 4x4)
    if (size === 4) {
      const startRow = row - (row % 2);
      const startCol = col - (col % 2);
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          if (currentBoard[i + startRow][j + startCol] === numStr && (i + startRow !== row || j + startCol !== col)) {
            return false;
          }
        }
      }
    }
    
    // For 5x5, we usually treat it as a Latin Square (Row/Col unique) 
    // because 5 is prime and doesn't have regular sub-boxes.

    return true;
  };

  const solve = (currentBoard, size) => {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (currentBoard[row][col] === '') {
          for (let num = 1; num <= size; num++) {
            if (isValid(currentBoard, row, col, num, size)) {
              currentBoard[row][col] = num.toString();
              if (solve(currentBoard, size)) return true;
              currentBoard[row][col] = ''; // Backtrack
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  const handleSolve = () => {
    // 1. Create a deep copy for the solver
    const boardCopy = board.map(row => [...row]);
    
    // 2. Track initial inputs so we can style them differently later
    const newInitialMap = new Set();
    let hasError = false;

    // 3. Pre-validation: Check if the user's current inputs are valid
    for(let r=0; r<gridSize; r++){
      for(let c=0; c<gridSize; c++){
        if(boardCopy[r][c] !== '') {
          newInitialMap.add(`${r}-${c}`);
          // Temporarily remove to check validity against others
          const val = boardCopy[r][c];
          boardCopy[r][c] = ''; 
          if(!isValid(boardCopy, r, c, val, gridSize)){
             hasError = true;
          }
          boardCopy[r][c] = val; // Put it back
        }
      }
    }

    if (hasError) {
      setStatus('error');
      return;
    }

    setInitialMap(newInitialMap);

    // 4. Run Solver
    if (solve(boardCopy, gridSize)) {
      setBoard(boardCopy);
      setStatus('solved');
    } else {
      setStatus('unsolvable');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans text-slate-800">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2 flex items-center justify-center gap-3">
          <Grid className="w-8 h-8" />
          Mini Sudoku Solver
        </h1>
        <p className="text-slate-500">Enter your numbers and let AI solve the grid.</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 mb-8 flex gap-2">
        <button
          onClick={() => setGridSize(4)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            gridSize === 4 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          4 x 4
        </button>
        <button
          onClick={() => setGridSize(5)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            gridSize === 5 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          5 x 5
        </button>
      </div>

      {/* Grid Container */}
      <div className="relative">
        <div 
          className="grid gap-2 bg-slate-200 p-2 rounded-xl border-2 border-slate-300 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            width: 'fit-content'
          }}
        >
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isInitial = initialMap.has(`${rowIndex}-${colIndex}`);
              // Determine cell styling
              let cellStyle = "w-14 h-14 sm:w-16 sm:h-16 text-2xl font-bold text-center rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all shadow-sm ";
              
              if (status === 'solved' && !isInitial) {
                cellStyle += "bg-green-100 text-green-700 border-2 border-green-200"; // Solved cell
              } else if (isInitial || (status === 'idle' && cell !== '')) {
                cellStyle += "bg-white text-slate-800 border-2 border-slate-200"; // User input
              } else {
                cellStyle += "bg-white text-slate-400 border border-slate-200 hover:bg-slate-50"; // Empty
              }

              return (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={cell}
                  onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
                  className={cellStyle}
                />
              );
            })
          ))}
        </div>
      </div>

      {/* Status Messages */}
      <div className="h-12 mt-6 flex items-center justify-center">
        {status === 'error' && (
          <span className="text-red-500 font-medium bg-red-50 px-4 py-2 rounded-full border border-red-100 animate-pulse">
            Conflict detected in your numbers!
          </span>
        )}
        {status === 'unsolvable' && (
          <span className="text-orange-500 font-medium bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
            No solution exists for this arrangement.
          </span>
        )}
        {status === 'solved' && (
          <span className="text-green-600 font-medium bg-green-50 px-4 py-2 rounded-full border border-green-100">
            Puzzle Solved!
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-4 w-full max-w-xs sm:max-w-md justify-center">
        <button
          onClick={() => resetBoard(gridSize)}
          className="flex-1 py-3 px-6 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
        >
          <Eraser size={20} />
          Reset
        </button>
        <button
          onClick={handleSolve}
          className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <Play size={20} fill="currentColor" />
          Solve
        </button>
      </div>

      {/* Description & User Guide */}
      <div className="mt-12 max-w-lg w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <BookOpen className="text-indigo-500" size={24} />
          <h2 className="text-lg font-bold text-slate-800">User Guide</h2>
        </div>
        
        <div className="space-y-5 text-sm text-slate-600">
          <div>
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
              Choose Your Grid
            </h3>
            <p className="ml-8">
              Select <strong>4x4</strong> for mini-sudoku or <strong>5x5</strong> for logic puzzles like the one in your image.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
              Enter Numbers
            </h3>
            <p className="ml-8 mb-2">Input the starting numbers from your puzzle.</p>
            <ul className="ml-8 list-disc list-inside bg-slate-50 p-3 rounded-lg border border-slate-100">
              <li><strong>4x4 Grid:</strong> Use numbers <span className="font-mono font-bold text-indigo-600">1-4</span>.</li>
              <li><strong>5x5 Grid:</strong> Use numbers <span className="font-mono font-bold text-indigo-600">1-5</span>.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span>
              Click Solve
            </h3>
            <p className="ml-8">
              The AI will calculate the solution.
              <br/>
              <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded-sm mr-1 align-middle mt-[-2px]"></span> 
              <strong>Green cells</strong> show the solution.
              <br/>
              <span className="inline-block w-3 h-3 bg-white border border-slate-300 rounded-sm mr-1 align-middle mt-[-2px]"></span> 
              <strong>White cells</strong> are your original inputs.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Info size={16} className="text-slate-400" />
              Game Rules
            </h3>
             <ul className="space-y-2 ml-1">
              <li className="flex gap-2">
                <span className="font-bold text-slate-400">•</span>
                <span><strong>Unique Rows & Columns:</strong> Numbers cannot be repeated in any horizontal row or vertical column.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-slate-400">•</span>
                <span><strong>4x4 Mode:</strong> Follows standard Sudoku rules where 2x2 sub-grids must also contain unique numbers.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;
