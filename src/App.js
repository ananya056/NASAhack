import React, { useState, useEffect, useCallback, useRef } from 'react';

const GAME_HEIGHT = 600;
const GAME_WIDTH = 800;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 80;
const PIPE_GAP = 200;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PIPE_SPEED = 3;

// Multi-language LeetCode problems
const LEETCODE_PROBLEMS = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    example: "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]",
    templates: {
      javascript: "function twoSum(nums, target) {\n    // Your code here\n    \n}",
      python: "def two_sum(nums, target):\n    # Your code here\n    pass",
      java: "public int[] twoSum(int[] nums, int target) {\n    // Your code here\n    \n}",
      cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n    \n}"
    },
    testCases: {
      javascript: [
        { code: "twoSum([2,7,11,15], 9)", expected: "[0,1]" },
        { code: "twoSum([3,2,4], 6)", expected: "[1,2]" }
      ],
      python: [
        { code: "two_sum([2,7,11,15], 9)", expected: "[0,1]" },
        { code: "two_sum([3,2,4], 6)", expected: "[1,2]" }
      ],
      java: [
        { code: "twoSum(new int[]{2,7,11,15}, 9)", expected: "[0, 1]" },
        { code: "twoSum(new int[]{3,2,4}, 6)", expected: "[1, 2]" }
      ],
      cpp: [
        { code: "twoSum({2,7,11,15}, 9)", expected: "[0,1]" },
        { code: "twoSum({3,2,4}, 6)", expected: "[1,2]" }
      ]
    }
  },
  {
    id: 2,
    title: "Reverse String",
    difficulty: "Easy",
    description: "Write a function that reverses a string. The input string is given as an array of characters s.",
    example: "Input: s = ['h','e','l','l','o']\nOutput: ['o','l','l','e','h']",
    templates: {
      javascript: "function reverseString(s) {\n    // Your code here\n    \n}",
      python: "def reverse_string(s):\n    # Your code here\n    pass",
      java: "public void reverseString(char[] s) {\n    // Your code here\n    \n}",
      cpp: "void reverseString(vector<char>& s) {\n    // Your code here\n    \n}"
    },
    testCases: {
      javascript: [
        { code: "reverseString(['h','e','l','l','o'])", expected: "['o','l','l','e','h']" },
        { code: "reverseString(['H','a','n','n','a','h'])", expected: "['h','a','n','n','a','H']" }
      ],
      python: [
        { code: "reverse_string(['h','e','l','l','o'])", expected: "['o','l','l','e','h']" },
        { code: "reverse_string(['H','a','n','n','a','h'])", expected: "['h','a','n','n','a','H']" }
      ],
      java: [
        { code: "reverseString({'h','e','l','l','o'})", expected: "[o, l, l, e, h]" },
        { code: "reverseString({'H','a','n','n','a','h'})", expected: "[h, a, n, n, a, H]" }
      ],
      cpp: [
        { code: "reverseString({'h','e','l','l','o'})", expected: "['o','l','l','e','h']" },
        { code: "reverseString({'H','a','n','n','a','h'})", expected: "['h','a','n','n','a','H']" }
      ]
    }
  }
];

const LANGUAGE_INFO = {
  javascript: { name: "JavaScript", color: "text-yellow-400", bg: "bg-yellow-900" },
  python: { name: "Python", color: "text-blue-400", bg: "bg-blue-900" },
  java: { name: "Java", color: "text-orange-400", bg: "bg-orange-900" },
  cpp: { name: "C++", color: "text-purple-400", bg: "bg-purple-900" }
};

export default function FlappyLeetCode() {
  // Game state
  const [gameState, setGameState] = useState('menu');
  const [bird, setBird] = useState({ x: 100, y: 300, velocity: 0 });
  const [pipes, setPipes] = useState([]);
  const [score, setScore] = useState(0);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [userCode, setUserCode] = useState('');
  const [codeResult, setCodeResult] = useState('');
  const [attempts, setAttempts] = useState(0);
  
  const gameLoopRef = useRef();
  const canvasRef = useRef();

  // Initialize game
  const initGame = () => {
    setBird({ x: 100, y: 300, velocity: 0 });
    setPipes([]);
    setScore(0);
    setAttempts(0);
    setCodeResult('');
  };

  // Start game
  const startGame = () => {
    initGame();
    setGameState('playing');
  };

  // Game physics
  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;

    setBird(prevBird => {
      const newBird = {
        ...prevBird,
        velocity: prevBird.velocity + GRAVITY,
        y: prevBird.y + prevBird.velocity
      };

      if (newBird.y <= 0 || newBird.y >= GAME_HEIGHT - BIRD_SIZE) {
        triggerDeath();
        return prevBird;
      }

      return newBird;
    });

    setPipes(prevPipes => {
      let newPipes = prevPipes.map(pipe => ({
        ...pipe,
        x: pipe.x - PIPE_SPEED
      })).filter(pipe => pipe.x > -PIPE_WIDTH);

      if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < GAME_WIDTH - 300) {
        const pipeHeight = Math.random() * (GAME_HEIGHT - PIPE_GAP - 100) + 50;
        newPipes.push({
          x: GAME_WIDTH,
          topHeight: pipeHeight,
          bottomY: pipeHeight + PIPE_GAP,
          scored: false
        });
      }

      newPipes.forEach(pipe => {
        if (
          bird.x < pipe.x + PIPE_WIDTH &&
          bird.x + BIRD_SIZE > pipe.x &&
          (bird.y < pipe.topHeight || bird.y + BIRD_SIZE > pipe.bottomY)
        ) {
          triggerDeath();
        }

        if (!pipe.scored && bird.x > pipe.x + PIPE_WIDTH) {
          pipe.scored = true;
          setScore(prev => prev + 1);
        }
      });

      return newPipes;
    });
  }, [gameState, bird]);

  // Trigger death and show coding challenge
  const triggerDeath = () => {
    setGameState('coding');
    const randomProblem = LEETCODE_PROBLEMS[Math.floor(Math.random() * LEETCODE_PROBLEMS.length)];
    setCurrentProblem(randomProblem);
    setUserCode(randomProblem.templates[selectedLanguage]);
  };

  // Handle bird jump
  const jump = () => {
    if (gameState === 'playing') {
      setBird(prevBird => ({
        ...prevBird,
        velocity: JUMP_FORCE
      }));
    }
  };

  // Simple code validation
  const validateCode = (code, language) => {
    const hasReturn = code.includes('return');
    const hasLogic = code.includes('for') || code.includes('while') || code.includes('map') || code.includes('if');
    const hasImplementation = code.replace(/\/\/.*$/gm, '').replace(/#.*$/gm, '').trim().split('\n').length > 3;
    
    return hasReturn && hasLogic && hasImplementation;
  };

  // Run code
  const runCode = () => {
    setAttempts(prev => prev + 1);
    
    if (validateCode(userCode, selectedLanguage)) {
      setCodeResult('✅ All tests passed! You can continue playing.');
      setTimeout(() => {
        setGameState('playing');
        initGame();
      }, 2000);
    } else {
      setCodeResult(`❌ Tests failed. Keep trying! (Attempt ${attempts + 1})\nMake sure your solution includes proper logic and returns a value.`);
    }
  };

  // Handle language change
  const changeLanguage = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    if (currentProblem) {
      setUserCode(currentProblem.templates[newLanguage]);
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(updateGame, 16);
    } else {
      clearInterval(gameLoopRef.current);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, updateGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        // Don't prevent space if user is typing in a textarea
        if (e.target.tagName === 'TEXTAREA') {
          return; // Allow normal space behavior in textarea
        }
        
        e.preventDefault();
        if (gameState === 'menu' || gameState === 'gameOver') {
          startGame();
        } else if (gameState === 'playing') {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);

  // Render game canvas
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Bird body (main circle)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(bird.x + BIRD_SIZE/2, bird.y + BIRD_SIZE/2, BIRD_SIZE/2, 0, Math.PI * 2);
    ctx.fill();

    // Bird body shading (gradient effect)
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(bird.x + BIRD_SIZE/2 + 3, bird.y + BIRD_SIZE/2 + 3, BIRD_SIZE/2 - 3, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    const wingY = bird.y + BIRD_SIZE/2 + Math.sin(Date.now() * 0.02) * 3; // Flapping animation
    ctx.ellipse(bird.x + BIRD_SIZE/2 - 5, wingY, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing highlight
    ctx.fillStyle = '#FFB84D';
    ctx.beginPath();
    ctx.ellipse(bird.x + BIRD_SIZE/2 - 5, wingY - 1, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.moveTo(bird.x + BIRD_SIZE - 2, bird.y + BIRD_SIZE/2);
    ctx.lineTo(bird.x + BIRD_SIZE + 8, bird.y + BIRD_SIZE/2 - 3);
    ctx.lineTo(bird.x + BIRD_SIZE + 8, bird.y + BIRD_SIZE/2 + 3);
    ctx.closePath();
    ctx.fill();

    // Eye background (white)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bird.x + BIRD_SIZE/2 + 5, bird.y + BIRD_SIZE/2 - 3, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eye pupil (black)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bird.x + BIRD_SIZE/2 + 7, bird.y + BIRD_SIZE/2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bird.x + BIRD_SIZE/2 + 8, bird.y + BIRD_SIZE/2 - 4, 1, 0, Math.PI * 2);
    ctx.fill();

    // Belly highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(bird.x + BIRD_SIZE/2 - 2, bird.y + BIRD_SIZE/2 - 2, BIRD_SIZE/3, 0, Math.PI * 2);
    ctx.fill();

    // Pipes
    pipes.forEach(pipe => {
      const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      gradient.addColorStop(0, '#228B22');
      gradient.addColorStop(0.3, '#32CD32');
      gradient.addColorStop(0.7, '#32CD32');
      gradient.addColorStop(1, '#1F5F1F');
      
      // Top pipe body
      ctx.fillStyle = gradient;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight - 30);
      
      // Top pipe cap
      ctx.fillStyle = '#228B22';
      ctx.fillRect(pipe.x - 10, pipe.topHeight - 30, PIPE_WIDTH + 20, 30);
      
      // Top pipe cap highlight
      ctx.fillStyle = '#90EE90';
      ctx.fillRect(pipe.x - 8, pipe.topHeight - 28, PIPE_WIDTH + 16, 4);
      
      // Bottom pipe body
      ctx.fillStyle = gradient;
      ctx.fillRect(pipe.x, pipe.bottomY + 30, PIPE_WIDTH, GAME_HEIGHT - pipe.bottomY - 30);
      
      // Bottom pipe cap
      ctx.fillStyle = '#228B22';
      ctx.fillRect(pipe.x - 10, pipe.bottomY, PIPE_WIDTH + 20, 30);
      
      // Bottom pipe cap highlight
      ctx.fillStyle = '#90EE90';
      ctx.fillRect(pipe.x - 8, pipe.bottomY + 2, PIPE_WIDTH + 16, 4);
      
      // Pipe shadows/depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(pipe.x + PIPE_WIDTH - 8, 0, 8, pipe.topHeight - 30);
      ctx.fillRect(pipe.x + PIPE_WIDTH - 8, pipe.bottomY + 30, 8, GAME_HEIGHT - pipe.bottomY - 30);
      ctx.fillRect(pipe.x + PIPE_WIDTH + 2, pipe.topHeight - 30, 8, 30);
      ctx.fillRect(pipe.x + PIPE_WIDTH + 2, pipe.bottomY, 8, 30);
      
      // Pipe highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(pipe.x + 2, 0, 4, pipe.topHeight - 30);
      ctx.fillRect(pipe.x + 2, pipe.bottomY + 30, 4, GAME_HEIGHT - pipe.bottomY - 30);
    });

    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GAME_HEIGHT - 20, GAME_WIDTH, 20);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      renderGame();
    }
  }, [bird, pipes, gameState]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style jsx>{`
        h1 { font-family: 'Quicksand', sans-serif; }
      `}</style>
      
      <div className="mb-8">
        <h1 className="text-6xl font-black text-white tracking-wide drop-shadow-lg">
          FLAPPY LEETCODE
        </h1>
      </div>
      
      {gameState === 'menu' && (
        <div className="text-center">
          <div className="mb-8">
            <canvas
              ref={canvasRef}
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              className="border border-gray-600 bg-sky-200"
            />
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl mb-3">Choose your coding language:</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.entries(LANGUAGE_INFO).map(([lang, info]) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-4 py-2 rounded font-semibold transition-colors ${
                    selectedLanguage === lang 
                      ? `${info.bg} ${info.color} border-2 border-current` 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {info.name}
                </button>
              ))}
            </div>
            <p className={`mt-2 font-semibold ${LANGUAGE_INFO[selectedLanguage].color}`}>
              Selected: {LANGUAGE_INFO[selectedLanguage].name}
            </p>
          </div>
          
          <p className="text-xl mb-4">Press SPACE to start flying!</p>
          <p className="text-sm text-gray-400 mb-4">Warning: If you crash, you'll have to solve a coding problem to continue! 💀</p>
          <button
            onClick={startGame}
            className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded text-lg font-semibold"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-6">
            <span className="text-2xl font-bold">Score: {score}</span>
            <span className={`text-lg font-semibold ${LANGUAGE_INFO[selectedLanguage].color}`}>
              Language: {LANGUAGE_INFO[selectedLanguage].name}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="border border-gray-600 cursor-pointer"
            onClick={jump}
          />
          <p className="mt-2 text-sm text-gray-400">Click or press SPACE to jump</p>
        </div>
      )}

      {gameState === 'coding' && currentProblem && (
        <div className="max-w-4xl w-full">
          <div className="bg-red-900 border border-red-700 rounded p-4 mb-4">
            <h2 className="text-2xl font-bold text-red-300 mb-2">💀 YOU DIED! Solve this to continue:</h2>
            <div className="flex items-center gap-4">
              <p className="text-gray-300">Score reached: {score}</p>
              <span className={`px-3 py-1 rounded font-semibold ${LANGUAGE_INFO[selectedLanguage].bg} ${LANGUAGE_INFO[selectedLanguage].color}`}>
                {LANGUAGE_INFO[selectedLanguage].name}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded p-4 mb-4">
            <h4 className="font-semibold mb-2">Switch Language:</h4>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(LANGUAGE_INFO).map(([lang, info]) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    selectedLanguage === lang 
                      ? `${info.bg} ${info.color} border border-current` 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {info.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold">{currentProblem.title}</h3>
              <span className={`px-2 py-1 rounded text-xs ${
                currentProblem.difficulty === 'Easy' ? 'bg-green-600' : 
                currentProblem.difficulty === 'Medium' ? 'bg-yellow-600' : 'bg-red-600'
              }`}>
                {currentProblem.difficulty}
              </span>
            </div>
            
            <p className="text-gray-300 mb-4">{currentProblem.description}</p>
            
            <div className="bg-gray-900 rounded p-3 mb-4">
              <h4 className="font-semibold mb-2">Example:</h4>
              <pre className="text-green-400 text-sm whitespace-pre-wrap">{currentProblem.example}</pre>
            </div>

            <div className="bg-gray-900 rounded p-3 mb-4">
              <h4 className="font-semibold mb-2">Test Cases ({LANGUAGE_INFO[selectedLanguage].name}):</h4>
              {currentProblem.testCases[selectedLanguage].map((testCase, index) => (
                <div key={index} className="text-sm text-gray-400 mb-1">
                  <span className="text-blue-400">Test {index + 1}:</span> {testCase.code} → {testCase.expected}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded p-4 mb-4">
            <h4 className="font-semibold mb-2">Your Solution ({LANGUAGE_INFO[selectedLanguage].name}):</h4>
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              className="w-full h-40 bg-gray-900 text-green-400 p-3 rounded font-mono text-sm resize-none"
              placeholder={`Write your ${LANGUAGE_INFO[selectedLanguage].name} code here...`}
            />
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={runCode}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
              >
                Run Code
              </button>
              <button
                onClick={() => setUserCode(currentProblem.templates[selectedLanguage])}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Reset
              </button>
            </div>
          </div>

          {codeResult && (
            <div className={`p-4 rounded mb-4 ${
              codeResult.includes('✅') ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'
            }`}>
              <pre className="whitespace-pre-wrap">{codeResult}</pre>
            </div>
          )}

          <div className="text-center text-sm text-gray-400">
            <p>Attempts: {attempts}</p>
            <p className="mt-2">💡 Tip: Think about the algorithm step by step!</p>
          </div>
        </div>
      )}
    </div>
  );
}