// Cloudflare Worker Script

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const url = new URL(request.url)
  
    // Serve the HTML page at the root path
    if (url.pathname === '/' && request.method === 'GET') {
      return serveHTML()
    }
  
    // Handle API routes
    if (url.pathname === '/api/transcribe' && request.method === 'POST') {
      return handleTranscription(request)
    }
  
    if (url.pathname === '/api/evaluate' && request.method === 'POST') {
      return handleEvaluation(request)
    }
  
    // Serve 404 for other routes
    return new Response('Not Found', { status: 404 })
  }
  
  async function serveHTML() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <!-- Added viewport meta tag for responsiveness -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Flashcard App</title>
    <style>
        /* Reset some default styles */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .flashcard {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 700px;
            text-align: center;
        }

        .question {
            font-size: 1.5em;
            margin-bottom: 20px;
        }

        .controls {
            margin-bottom: 20px;
        }

        .controls button {
            padding: 10px 20px;
            font-size: 1em;
            margin: 5px;
            cursor: pointer;
            border: none;
            border-radius: 5px;
            background-color: #007BFF;
            color: #fff;
            transition: background-color 0.3s ease;
        }

        .controls button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }

        .controls button:hover:not(:disabled) {
            background-color: #0056b3;
        }

        .answer, .evaluation {
            margin-top: 20px;
            padding: 15px;
            background-color: #e8f4fd;
            border-radius: 5px;
            text-align: left;
        }

        .self-evaluation {
            margin-top: 20px;
        }

        .self-evaluation label {
            display: block;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .self-evaluation button {
            padding: 10px 15px;
            margin: 5px;
            cursor: pointer;
            border: none;
            border-radius: 5px;
            background-color: #28a745;
            color: #fff;
            transition: background-color 0.3s ease;
        }

        .self-evaluation button:hover {
            background-color: #1e7e34;
        }

        .rating-container {
            display: flex;
            align-items: center;
            margin-top: 10px;
        }

        .rating-label {
            width: 150px;
            font-weight: bold;
        }

        .stars {
            display: flex;
        }

        .stars span {
            font-size: 1.5em;
            color: gold;
            margin-right: 5px;
        }

        .navigation {
            margin-top: 30px;
            text-align: center;
        }

        .navigation button {
            padding: 10px 20px;
            font-size: 1em;
            margin: 0 10px;
            cursor: pointer;
            border: none;
            border-radius: 5px;
            background-color: #17a2b8;
            color: #fff;
            transition: background-color 0.3s ease;
        }

        .navigation button:hover {
            background-color: #117a8b;
        }

        #startQuizBtn {
            padding: 15px 30px;
            font-size: 1.2em;
            cursor: pointer;
            margin-top: 50px;
            border: none;
            border-radius: 5px;
            background-color: #ffc107;
            color: #212529;
            transition: background-color 0.3s ease;
        }

        #startQuizBtn:hover {
            background-color: #e0a800;
        }

        /* Recording Indicator Styles */
        #recordingIndicator {
            display: none; /* Hidden by default */
            margin-top: 10px;
            font-weight: bold;
            color: red;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #recordingIndicator .dot {
            height: 12px;
            width: 12px;
            background-color: red;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
            animation: blink 1s infinite;
        }

        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
        }

        /* Responsive Design */
        @media (max-width: 600px) {
            .flashcard {
                padding: 15px;
            }

            .question {
                font-size: 1.2em;
            }

            .controls button,
            .self-evaluation button,
            .navigation button,
            #startQuizBtn {
                width: 100%;
                margin: 5px 0;
            }

            .rating-label {
                width: 120px;
            }
        }

        /* New Loading Indicator Styles */
        .loading-indicator {
            display: none; /* Hidden by default */
            margin-top: 10px;
            font-weight: bold;
            color: #007BFF;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .loading-indicator .spinner {
            border: 4px solid #f3f3f3; /* Light grey */
            border-top: 4px solid #007BFF; /* Blue */
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>

<div class="flashcard">
    <!-- Start Quiz Button -->
    <div id="startScreen">
        <button id="startQuizBtn">Start Quiz</button>
    </div>

    <!-- Quiz Content -->
    <div id="quizContent" style="display:none;">
        <div class="question" id="question">Loading question...</div>

        <div class="controls">
            <button id="showAnswerBtn" disabled>Show Answer</button>
            <!-- Recording Indicator -->
            <div id="recordingIndicator">
                <span class="dot"></span> Recording...
            </div>
            <!-- New Transcribing Indicator -->
            <div id="transcribingIndicator" class="loading-indicator">
                <div class="spinner"></div> Transcribing your answer...
            </div>
            <!-- New Analyzing Indicator -->
            <div id="analyzingIndicator" class="loading-indicator">
                <div class="spinner"></div> Analyzing your answer...
            </div>
        </div>

        <div class="answer" id="answer" style="display:none;">
            <strong>Correct Answer:</strong>
            <p id="correctAnswer"></p>
        </div>

        <div class="self-evaluation" id="selfEval" style="display:none;">
            <label>Self-Evaluate Your Answer:</label>
            <button class="selfEvalBtn" data-rating="Excellent">Excellent</button>
            <button class="selfEvalBtn" data-rating="Good">Good</button>
            <button class="selfEvalBtn" data-rating="Fair">Fair</button>
            <button class="selfEvalBtn" data-rating="Poor">Poor</button>
        </div>

        <div class="evaluation" id="gptEval" style="display:none;">
            <strong>GPT-4 Evaluation:</strong>
            <div id="gptRating" class="rating-container">
                <div class="rating-label">Accuracy:</div>
                <div class="stars" id="gptAccuracy"></div>
            </div>
            <div class="rating-container">
                <div class="rating-label">Completeness:</div>
                <div class="stars" id="gptCompleteness"></div>
            </div>
            <div class="rating-container">
                <div class="rating-label">Clarity:</div>
                <div class="stars" id="gptClarity"></div>
            </div>
            <p id="gptFeedback"></p>
        </div>

        <div class="navigation" id="navigation" style="display:none;">
            <button id="prevBtn">Previous</button>
            <button id="nextBtn">Next</button>
        </div>
    </div>
</div>

<script>
    const flashcards = [
        {
            question: "What is the capital of France?",
            answer: "Paris"
        },
        {
            question: "What is the largest planet in our Solar System?",
            answer: "Jupiter"
        },
        {
            question: "Who wrote the play 'Romeo and Juliet'?",
            answer: "William Shakespeare"
        },
        // Add more predefined flashcards here
    ]

    let currentCard = 0
    let mediaRecorder
    let audioChunks = []
    let transcribedText = ''

    const startScreen = document.getElementById('startScreen')
    const startQuizBtn = document.getElementById('startQuizBtn')
    const quizContent = document.getElementById('quizContent')
    const questionEl = document.getElementById('question')
    const showAnswerBtn = document.getElementById('showAnswerBtn')
    const answerEl = document.getElementById('answer')
    const correctAnswerEl = document.getElementById('correctAnswer')
    const selfEvalEl = document.getElementById('selfEval')
    const gptEvalEl = document.getElementById('gptEval')
    const gptFeedbackEl = document.getElementById('gptFeedback')
    const gptAccuracyEl = document.getElementById('gptAccuracy')
    const gptCompletenessEl = document.getElementById('gptCompleteness')
    const gptClarityEl = document.getElementById('gptClarity')
    const navigationEl = document.getElementById('navigation')
    const prevBtn = document.getElementById('prevBtn')
    const nextBtn = document.getElementById('nextBtn')
    const selfEvalButtons = document.querySelectorAll('.selfEvalBtn')
    const recordingIndicator = document.getElementById('recordingIndicator') // Existing element
    const transcribingIndicator = document.getElementById('transcribingIndicator') // New element
    const analyzingIndicator = document.getElementById('analyzingIndicator') // New element

    // Start Quiz
    startQuizBtn.addEventListener('click', () => {
        startScreen.style.display = 'none'
        quizContent.style.display = 'block'
        loadFlashcard(currentCard)
    })

    function loadFlashcard(index) {
        const card = flashcards[index]
        questionEl.textContent = card.question
        answerEl.style.display = 'none'
        selfEvalEl.style.display = 'none'
        gptEvalEl.style.display = 'none'
        navigationEl.style.display = 'none'
        showAnswerBtn.disabled = true
        // Reset previous data
        transcribedText = ''
        gptAccuracyEl.innerHTML = ''
        gptCompletenessEl.innerHTML = ''
        gptClarityEl.innerHTML = ''
        gptFeedbackEl.textContent = ''
        // Hide evaluation indicators
        analyzingIndicator.style.display = 'none'
        // Start recording automatically
        startRecording()
    }

    // Handle navigation
    prevBtn.addEventListener('click', () => {
        if (currentCard > 0) {
            currentCard--
            loadFlashcard(currentCard)
        }
    })

    nextBtn.addEventListener('click', () => {
        if (currentCard < flashcards.length -1 ) {
            currentCard++
            loadFlashcard(currentCard)
        }
    })

    // Handle showing answer
    showAnswerBtn.addEventListener('click', () => {
        stopRecording()
    })

    // Start Recording
    function startRecording() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream)
                mediaRecorder.start()
                showAnswerBtn.disabled = false
                audioChunks = []

                // Show recording indicator
                recordingIndicator.style.display = 'flex'

                mediaRecorder.addEventListener('dataavailable', event => {
                    audioChunks.push(event.data)
                })

                mediaRecorder.addEventListener('stop', () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
                    // Hide recording indicator
                    recordingIndicator.style.display = 'none'
                    // Show transcribing indicator
                    transcribingIndicator.style.display = 'flex'
                    transcribeAudio(audioBlob)
                })
            })
            .catch(err => {
                alert('Microphone access denied or not available.')
                console.error(err)
            })
    }

    // Stop Recording
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop()
            showAnswerBtn.disabled = true
        }
    }

    // Transcribe audio using Worker API
    async function transcribeAudio(audioBlob) {
        const formData = new FormData()
        formData.append('file', audioBlob, 'recording.wav')
        formData.append('model', 'whisper-1')

        try {
            const response = await fetch('/api/transcribe', { // Updated endpoint
                method: 'POST',
                body: formData,
            })

            const data = await response.json()
            // Hide transcribing indicator
            transcribingIndicator.style.display = 'none'

            if (data.text) {
                transcribedText = data.text
                displayAnswer()
            } else {
                alert('Transcription failed. Please try again.')
                console.error(data)
            }
        } catch (error) {
            // Hide transcribing indicator
            transcribingIndicator.style.display = 'none'
            alert('Error during transcription.')
            console.error(error)
        }
    }

    // Display Answer and Show Self-Evaluation
    function displayAnswer() {
        const correctAnswer = flashcards[currentCard].answer
        correctAnswerEl.textContent = correctAnswer
        answerEl.style.display = 'block'
        selfEvalEl.style.display = 'block'
    }

    // Handle Self-Evaluation with Buttons
    selfEvalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const rating = button.getAttribute('data-rating')
            if (!rating) {
                alert('Please select a rating.')
                return
            }
            // Show analyzing indicator
            analyzingIndicator.style.display = 'flex'
            // Proceed to GPT-4 evaluation
            evaluateWithGPT4()
        })
    })

    async function evaluateWithGPT4() {
        const userAnswer = transcribedText
        const correctAnswer = flashcards[currentCard].answer
        const question = flashcards[currentCard].question

        try {
            const response = await fetch('/api/evaluate', { // Updated endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question,
                    userAnswer,
                    correctAnswer,
                }),
            })

            const evaluation = await response.json()
            // Hide analyzing indicator
            analyzingIndicator.style.display = 'none'

            if (evaluation.error) {
                alert('Evaluation failed. Please try again.')
                console.error(evaluation.error)
                return
            }

            displayGPTEvaluation(evaluation)
        } catch (error) {
            // Hide analyzing indicator
            analyzingIndicator.style.display = 'none'
            alert('Error during GPT-4 evaluation.')
            console.error(error)
        }
    }

    function displayGPTEvaluation(evaluation) {
        // Function to convert rating string to stars
        function getStars(rating) {
            const ratingMap = {
                "Excellent": 4,
                "Good": 3,
                "Fair": 2,
                "Poor": 1
            }
            const starsCount = ratingMap[rating] || 0
            let starsHTML = ''
            for (let i = 0; i < starsCount; i++) {
                starsHTML += '★'
            }
            for (let i = starsCount; i < 4; i++) {
                starsHTML += '☆'
            }
            return starsHTML
        }

        // Display ratings
        gptAccuracyEl.innerHTML = getStars(evaluation.accuracy)
        gptCompletenessEl.innerHTML = getStars(evaluation.completeness)
        gptClarityEl.innerHTML = getStars(evaluation.clarity)

        // Display feedback
        gptFeedbackEl.textContent = evaluation.feedback

        gptEvalEl.style.display = 'block'
        navigationEl.style.display = 'block'
    }
</script>

</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    })
  }
  
  async function handleTranscription(request) {
    try {
      // Parse the incoming form data
      const formData = await request.formData()
      const file = formData.get('file')
      const model = formData.get('model') || 'whisper-1'
  
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file uploaded.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
  
      // Prepare form data for OpenAI Whisper API
      const openaiFormData = new FormData()
      openaiFormData.append('file', file)
      openaiFormData.append('model', model)
  
      // Make a request to OpenAI Whisper API
      const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: openaiFormData,
      })
  
      const data = await openaiResponse.json()
      return new Response(JSON.stringify(data), {
        status: openaiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Transcription failed.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
  
  async function handleEvaluation(request) {
    try {
      // Parse the incoming JSON data
      const { question, userAnswer, correctAnswer } = await request.json()
  
      if (!question || !userAnswer || !correctAnswer) {
        return new Response(JSON.stringify({ error: 'Missing parameters.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
  
      // Construct the prompt for GPT-4
      const prompt = `You are an educational assistant that evaluates user answers to flashcard questions. Provide your evaluation in the following JSON format adhering to the schema below:

{
  "accuracy": "Excellent | Good | Fair | Poor",
  "completeness": "Excellent | Good | Fair | Poor",
  "clarity": "Excellent | Good | Fair | Poor",
  "feedback": "Constructive feedback for the user."
}

Question: "${question}"
User Answer: "${userAnswer}"
Correct Answer: "${correctAnswer}"
`
  
      // Make a request to OpenAI GPT-4 API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are ChatGPT, a large language model trained by OpenAI.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      })
  
      const data = await openaiResponse.json()
  
      if (data.choices && data.choices.length > 0) {
        let gptResponse = data.choices[0].message.content.trim()
  
        // Extract JSON from the response
        const jsonStart = gptResponse.indexOf('{')
        const jsonEnd = gptResponse.lastIndexOf('}')
        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error('JSON block not found in GPT response.')
        }
        const jsonString = gptResponse.substring(jsonStart, jsonEnd + 1)
        const gptEvaluation = JSON.parse(jsonString)
  
        return new Response(JSON.stringify(gptEvaluation), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      } else {
        throw new Error('Invalid GPT response.')
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Evaluation failed.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
