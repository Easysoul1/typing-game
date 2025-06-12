const fallbackQuotes = [
  'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
  'There is nothing more deceptive than an obvious fact.',
  'I ought to know by this time that when a fact appears to be opposed to a long train of deductions it invariably proves to be capable of bearing some other interpretation.',
  'I never make exceptions. An exception disproves the rule.',
  'What one man can invent another can discover.',
  'Nothing clears up a case so much as stating it to another person.',
  'Education never ends, Watson. It is a series of lessons, with the greatest for the last.',
];

// Game state variables
let words = [];
let wordIndex = 0;
let startTime;
let timerInterval;
let correctChars = 0;
let totalChars = 0;
let gameActive = false;

// DOM elements
const quoteElement = document.getElementById('quote');
const messageElement = document.getElementById('message');
const typedValueElement = document.getElementById('typed-value');
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const timerElement = document.getElementById('timer');

// Timer settings
const initialTime = 120; // 2 minutes
let timeLeft = initialTime;

async function getRandomSentence() {
  try {
    const response = await fetch('https://api.quotable.io/random');
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error fetching sentence:', error);
    const quoteIndex = Math.floor(Math.random() * fallbackQuotes.length);
    return fallbackQuotes[quoteIndex];
  }
}

function startTimer() {
  timeLeft = initialTime;
  timerElement.textContent = timeLeft;
  clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;
    
    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);
}

function calculateWPM(chars, seconds) {
  // WPM formula: (characters / 5) / (minutes elapsed)
  const words = chars / 5;
  const minutes = seconds / 60;
  return Math.round(words / minutes);
}

function updateStats() {
  if (!gameActive) return;
  
  const elapsedTime = (new Date().getTime() - startTime) / 1000;
  const currentWPM = calculateWPM(correctChars, elapsedTime);
  const currentAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
  
  wpmElement.textContent = currentWPM;
  accuracyElement.textContent = `${currentAccuracy}%`;
}

function endGame(completed) {
  clearInterval(timerInterval);
  gameActive = false;
  typedValueElement.disabled = true;
  
  const elapsedTime = (new Date().getTime() - startTime) / 1000;
  const finalWPM = calculateWPM(correctChars, elapsedTime);
  const finalAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
  
  if (completed) {
    messageElement.textContent = `Congratulations! You finished in ${elapsedTime.toFixed(1)} seconds.`;
    messageElement.className = 'message success';
  } else {
    messageElement.textContent = `Time's up! Your score: ${finalWPM} WPM with ${finalAccuracy}% accuracy.`;
    messageElement.className = 'message error';
  }
  
  // Update final stats
  wpmElement.textContent = finalWPM;
  accuracyElement.textContent = `${finalAccuracy}%`;
}

function resetGame() {
  clearInterval(timerInterval);
  gameActive = false;
  
  // Reset UI
  quoteElement.innerHTML = '';
  typedValueElement.value = '';
  typedValueElement.className = '';
  messageElement.textContent = '';
  messageElement.className = 'message';
  
  // Reset stats
  wpmElement.textContent = '0';
  accuracyElement.textContent = '100%';
  timerElement.textContent = initialTime;
  timeLeft = initialTime;
  
  // Enable start button
  startButton.disabled = false;
}

async function startGame() {
  // Get a quote
  const quote = await getRandomSentence();
  words = quote.split(' ');
  wordIndex = 0;
  correctChars = 0;
  totalChars = 0;
  
  // UI updates
  const spanWords = words.map((word, index) => 
    `<span id="word-${index}">${word} </span>`
  );
  quoteElement.innerHTML = spanWords.join('');
  document.getElementById(`word-0`).className = 'current';
  
  // Setup textarea
  typedValueElement.value = '';
  typedValueElement.disabled = false;
  typedValueElement.focus();
  messageElement.textContent = '';
  
  // Start timer and game
  startTime = new Date().getTime();
  startTimer();
  gameActive = true;
  startButton.disabled = true;
}

// Event listeners
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);

typedValueElement.addEventListener('input', (e) => {
  if (!gameActive) return;
  
  updateStats();
  
  const currentWord = words[wordIndex];
  const typedValue = typedValueElement.value;
  const currentWordElement = document.getElementById(`word-${wordIndex}`);
  
  // Check if current word is correct
  if (currentWord.startsWith(typedValue)) {
    // Correct so far
    typedValueElement.className = '';
    currentWordElement.className = 'current';
    
    // Update character count for accuracy
    if (typedValue.length === 1) {
      totalChars += currentWord.length;
    }
  } else {
    // Incorrect
    typedValueElement.className = 'error';
    currentWordElement.className = 'incorrect';
  }
  
  // Check if word is completed
  if (typedValue.endsWith(' ') && typedValue.trim() === currentWord) {
    // Word completed correctly
    correctChars += currentWord.length;
    
    // Move to next word
    typedValueElement.value = '';
    wordIndex++;
    
    // Update word highlighting
    currentWordElement.className = 'correct';
    
    if (wordIndex < words.length) {
      document.getElementById(`word-${wordIndex}`).className = 'current';
    } else {
      // All words completed
      endGame(true);
    }
  }
});

// Initialize game
resetGame();