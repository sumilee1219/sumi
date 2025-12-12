// --- Quiz Data ---
const questions = [
    { question: "I'd rather park at a paid parking lot immediately than spend 10+ minutes searching for free parking.", tag: "(Transportation)", category: "Convenience" },
    { question: "I'm willing to drive 30 minutes to an outlet to save 20% on groceries instead of shopping at a nearby supermarket.", tag: "(Groceries)", category: "Cost" },
    { question: "I often forget to cancel free trials before they auto-renew and get charged.", tag: "(Subscription)", category: "Convenience" },
    { question: "I add unnecessary items to my cart to meet minimum order requirements and avoid delivery fees.", tag: "(Shopping)", category: "Cost" },
    { question: "When buying a product, one negative review worries me more than 100 positive reviews.", tag: "(Reviews)", category: "Safety" },
    { question: "I feel more comfortable following proven methods rather than pioneering something no one has tried.", tag: "(New Things)", category: "Safety" },
    { question: "Even when a deadline is approaching, I keep working until the last minute to fix unsatisfactory parts.", tag: "(Perfection)", category: "Emotion" },
    { question: "When planning trips, I always ensure there's 'buffer time' without detailed schedules.", tag: "(Planning)", category: "Emotion" },
    { question: "I don't hesitate to pay extra for faster delivery (e.g., $3) when ordering online.", tag: "(Orders)", category: "Time" },
    { question: "I prefer paying professionals to fix things immediately rather than learning to assemble furniture or do simple repairs myself.", tag: "(DIY)", category: "Convenience" },
    { question: "I'd rather pay a small fee for an organized report than navigate through multiple webpages to find information.", tag: "(Information)", category: "Convenience" },
    { question: "If finding and applying coupons takes more than 5 minutes, I just pay full price.", tag: "(Discounts)", category: "Convenience" },
    { question: "Before trying a completely new restaurant or hobby, I read at least 3 detailed reviews first.", tag: "(New Experiences)", category: "Safety" },
    { question: "Even when nothing is wrong, I never skip regular maintenance checkups for machines or vehicles.", tag: "(Maintenance)", category: "Safety" },
    { question: "Before submitting projects or work, I keep extending review time due to perfectionism even when I have time.", tag: "(Perfection)", category: "Emotion" },
    { question: "When planning trips or major events, I always prepare a backup 'Plan B' in case things go wrong.", tag: "(Planning)", category: "Safety" },
    { question: "I actively select 'no disposable items' on delivery apps to reduce packaging waste.", tag: "(Orders)", category: "Sustainability" },
    { question: "In group chats, I consider others' reactions and feelings first and edit my messages before sending.", tag: "(Communication)", category: "Community" },
    { question: "When choosing gifts, I prioritize the recipient's personal feelings and what would truly make them happy.", tag: "(Gifts)", category: "Emotion" },
    { question: "In public places or shared offices, I'm mindful that my belongings don't inconvenience others.", tag: "(Space)", category: "Community" },
    { question: "When disposing of broken or unwanted items, I make extra effort to follow proper recycling regulations.", tag: "(Products)", category: "Sustainability" }
];

// --- Quiz State (Variables replacing React's useState) ---
let currentQuestion = 0;
let answers = [];
let isComplete = false;
const quizContainer = document.getElementById('quiz-container');

// --- Utility Functions ---

const sendDataToSheet = (finalAnswers) => {
    const data = {
        answers: finalAnswers,
        timestamp: new Date().toISOString()
    };

    // The fetch call remains the same as it's pure JavaScript
    fetch('https://script.google.com/macros/s/AKfycbwW5xN8Yi_hQT2IapUDxC6Bb0AKaUdt9-_Kn33RCh5qV_jY5pYrq0859rT80YYQQHMD/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .catch(error => console.error('Error sending data:', error));
};

const calculateCategoryScores = () => {
    const categoryScores = {};
    const categoryCounts = {};

    answers.forEach(answer => {
        if (!categoryScores[answer.category]) {
            categoryScores[answer.category] = 0;
            categoryCounts[answer.category] = 0;
        }
        categoryScores[answer.category] += answer.score;
        categoryCounts[answer.category] += 1;
    });

    const categoryPercentages = {};

    Object.keys(categoryScores).forEach(category => {
        const maxScore = categoryCounts[category] * 5;
        categoryPercentages[category] = {
            score: categoryScores[category],
            maxScore: maxScore,
            percentage: ((categoryScores[category] / maxScore) * 100).toFixed(1),
            count: categoryCounts[category]
        };
    });

    return categoryPercentages;
};

const getTopCategory = (categoryPercentages) => {
    let topCategory = '';
    let highestPercentage = -1;

    Object.keys(categoryPercentages).forEach(category => {
        const percentage = parseFloat(categoryPercentages[category].percentage);
        if (percentage > highestPercentage) {
            highestPercentage = percentage;
            topCategory = category;
        }
    });

    return topCategory;
};

// --- Rendering Functions ---

const renderQuestion = () => {
    const totalQuestions = questions.length;
    const currentQ = questions[currentQuestion];
    const progressPercent = ((currentQuestion + 1) / totalQuestions) * 100;

    // Build the question screen HTML
    quizContainer.innerHTML = `
        <div class="progress-bar-container">
            <div class="progress-header">
                <span class="progress-text-main">
                    Question ${currentQuestion + 1} / ${totalQuestions}
                </span>
                <span class="progress-text-sub">
                    Questions (5-point scale: higher score = more agreement)
                </span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${progressPercent}%;"></div>
            </div>
        </div>

        <h2 class="question-text">
            ${currentQ.question}
        </h2>

        <div class="answer-grid" id="answer-grid">
            <button class="answer-button" data-score="1">1</button>
            <button class="answer-button" data-score="2">2</button>
            <button class="answer-button" data-score="3">3</button>
            <button class="answer-button" data-score="4">4</button>
            <button class="answer-button" data-score="5">5</button>
        </div>
        
        <div class="answer-scale-labels">
            <span>Strongly Disagree</span>
            <span>Strongly Agree</span>
        </div>
    `;

    // Add event listeners to the buttons
    document.getElementById('answer-grid').querySelectorAll('.answer-button').forEach(button => {
        button.addEventListener('click', function() {
            const score = parseInt(this.getAttribute('data-score'));
            handleAnswer(score);
        });
    });
};

const renderResults = () => {
    const categoryPercentages = calculateCategoryScores();
    const topCategory = getTopCategory(categoryPercentages);
    
    // Sort categories by percentage descending
    const sortedCategories = Object.keys(categoryPercentages).sort((a, b) => 
        parseFloat(categoryPercentages[b].percentage) - parseFloat(categoryPercentages[a].percentage)
    );

    // Build Category Analysis HTML
    const analysisHTML = sortedCategories.map(category => {
        const data = categoryPercentages[category];
        const percent = data.percentage;
        const colorClass = category; // Assumes class name matches category name for CSS styling
        
        return `
            <div class="category-item">
                <div class="category-stats">
                    <div class="category-name">
                        <span>${category}</span>
                        <span>(${data.count} questions)</span>
                    </div>
                    <div class="category-score">
                        <span>${percent}%</span>
                        <span>(${data.score}/${data.maxScore} points)</span>
                    </div>
                </div>
                <div class="category-progress-track">
                    <div 
                        class="category-progress-fill ${colorClass}"
                        style="width: ${percent}%;"
                    >
                        <span>${percent}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Build Detailed Responses HTML
    const responsesHTML = questions.map((q, index) => {
        const answer = answers[index];
        const score = answer ? answer.score : 'N/A'; // Should always exist if complete
        const categoryClass = q.category;
        
        return `
            <div class="response-item">
                <div class="response-item-header">
                    <p class="response-question">
                        <span class="response-tag">${q.tag}</span> Q${index + 1}: ${q.question}
                    </p>
                    <span class="response-category-tag ${categoryClass}">
                        ${q.category}
                    </span>
                </div>
                <p class="response-answer">
                    Response: <span class="response-score">${score} points</span>
                </p>
            </div>
        `;
    }).join('');

    // Build the final results screen HTML
    quizContainer.innerHTML = `
        <div class="results-header">
            <p>Your Value Type is</p>
            <h1>${topCategory}</h1>
            <p>This is your highest category</p>
        </div>

        <div class="category-analysis">
            <h2>Category Analysis</h2>
            ${analysisHTML}
        </div>

        <div class="detailed-responses">
            <h2>Detailed Responses</h2>
            <div class="response-list">
                ${responsesHTML}
            </div>
        </div>

        <button id="restart-button" class="restart-button">
            Restart Quiz
        </button>
    `;

    // Add event listener to the restart button
    document.getElementById('restart-button').addEventListener('click', restartQuiz);
};

// --- Main Logic Functions ---

const handleAnswer = (score) => {
    const newAnswer = { score, category: questions[currentQuestion].category };
    answers.push(newAnswer);

    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        renderQuestion();
    } else {
        isComplete = true;
        sendDataToSheet(answers);
        renderResults();
    }
};

const restartQuiz = () => {
    currentQuestion = 0;
    answers = [];
    isComplete = false;
    renderQuestion();
};

// Initialize the quiz when the script loads
document.addEventListener('DOMContentLoaded', renderQuestion);
