
const $ = (id) => document.getElementById(id);

const lessons = {
  maths: {
    name: "Mathematics",
    icon: "🔢",
    title: "Addition",
    content: "Addition means putting numbers together to find the total. For example, 3 + 2 = 5. Imagine you have 3 oranges and receive 2 more. You now have 5 oranges!",
    questions: [
      { q: "What is 3 + 2?", options: ["4", "5", "6"], answer: 1, why: "3 + 2 = 5." },
      { q: "What is 7 + 4?", options: ["10", "12", "11"], answer: 2, why: "7 + 4 = 11." },
      { q: "What is 10 + 6?", options: ["16", "15", "14"], answer: 0, why: "10 + 6 = 16." }
    ]
  },
  english: {
    name: "English Language",
    icon: "📖",
    title: "Nouns",
    content: "A noun is a word that names a person, place, animal or thing. Examples include Daniel, Lagos, dog and book.",
    questions: [
      { q: "Which word is a noun?", options: ["Quickly", "School", "Run"], answer: 1, why: "School is a place, so it is a noun." },
      { q: "Which word names an animal?", options: ["Tiger", "Happy", "Slowly"], answer: 0, why: "Tiger is the name of an animal." },
      { q: "Which is a proper noun?", options: ["City", "Girl", "Lagos"], answer: 2, why: "Lagos is the special name of a place." }
    ]
  },
  science: {
    name: "Basic Science",
    icon: "🔬",
    title: "Living Things",
    content: "Living things need resources to survive. They grow and respond to their surroundings. Plants, humans and animals are living things.",
    questions: [
      { q: "Which is a living thing?", options: ["Stone", "Goat", "Chair"], answer: 1, why: "A goat is a living animal." },
      { q: "What do plants need to make food?", options: ["Sunlight", "Plastic", "Sand only"], answer: 0, why: "Plants use sunlight to make food." },
      { q: "Which is non-living?", options: ["Bird", "Tree", "Rock"], answer: 2, why: "A rock does not grow or carry out life processes." }
    ]
  },
  phe: {
    name: "Physical & Health Education",
    icon: "⚽",
    title: "Healthy Habits",
    content: "Healthy habits help keep our bodies strong. We should eat balanced meals, exercise regularly, get enough sleep and maintain personal hygiene.",
    questions: [
      { q: "Which habit helps keep us healthy?", options: ["Never bathing", "Regular exercise", "Never sleeping"], answer: 1, why: "Regular exercise helps keep the body healthy." },
      { q: "What should we do before eating?", options: ["Wash our hands", "Touch dirty objects", "Skip cleaning"], answer: 0, why: "Handwashing helps remove germs." },
      { q: "Why do children need sleep?", options: ["To avoid water", "To stop growing", "To rest and grow"], answer: 2, why: "Sleep supports rest, growth and learning." }
    ]
  },
  agric: {
    name: "Agricultural Science",
    icon: "🌱",
    title: "Farm Tools",
    content: "Farm tools help farmers carry out different jobs. A hoe helps loosen soil and remove weeds. A watering can helps water crops. A cutlass can clear vegetation when used safely by a responsible adult.",
    questions: [
      { q: "Which tool can help loosen soil?", options: ["Television", "Hoe", "Pillow"], answer: 1, why: "A hoe is used for loosening soil and weeding." },
      { q: "What does a watering can do?", options: ["Water plants", "Cut wood", "Measure time"], answer: 0, why: "A watering can helps supply water to plants." },
      { q: "Who grows crops on a farm?", options: ["Pilot", "Tailor", "Farmer"], answer: 2, why: "Farmers grow crops and may also raise animals." }
    ]
  }
};

let questionIndex = 0;
let score = 0;
let selectedAnswer = null;
let answered = false;

function startLearning() {
  const subject = $("subjectSelect").value;
  const level = $("levelSelect").value;
  const classNumber = $("classSelect").value;
  const age = $("ageSelect").value;
  const lesson = lessons[subject];

  questionIndex = 0;
  score = 0;

  $("lessonSection").classList.remove("hidden");
  $("lessonTag").textContent = `${lesson.icon} ${lesson.name.toUpperCase()}`;
  $("lessonTitle").textContent = lesson.title;
  $("lessonInfo").textContent =
    `Primary ${classNumber} • Age ${age} • ${level} level`;

  $("lessonContent").textContent = lesson.content;

  renderQuestion();
  $("lessonSection").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function renderQuestion() {
  const subject = $("subjectSelect").value;
  const questions = lessons[subject].questions;
  const question = questions[questionIndex];

  selectedAnswer = null;
  answered = false;

  $("feedback").textContent = "";
  $("quizArea").innerHTML = "";

  const heading = document.createElement("h3");
  heading.textContent =
    `Question ${questionIndex + 1} of ${questions.length}`;

  const prompt = document.createElement("p");
  prompt.textContent = question.q;
  prompt.style.fontWeight = "700";

  $("quizArea").append(heading, prompt);

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

    button.addEventListener("click", () => {
      if (answered) return;

      selectedAnswer = index;

      document.querySelectorAll(".quiz-option").forEach((item) => {
        item.classList.remove("selected");
      });

      button.classList.add("selected");
    });

    $("quizArea").appendChild(button);
  });

  $("checkBtn").classList.remove("hidden");
  $("nextBtn").classList.add("hidden");
  $("checkBtn").disabled = false;
  $("checkBtn").textContent = "Check Answer ✓";
}

function checkAnswer() {
  if (answered) return;

  if (selectedAnswer === null) {
    $("feedback").textContent = "👆 Choose an answer first!";
    return;
  }

  answered = true;

  const subject = $("subjectSelect").value;
  const question = lessons[subject].questions[questionIndex];
  const correct = selectedAnswer === question.answer;

  if (correct) score++;

  $("feedback").textContent = correct
    ? `🎉 Correct! ${question.why}`
    : `💡 Not quite! The correct answer is ${
        question.options[question.answer]
      }. ${question.why}`;

  document.querySelectorAll(".quiz-option").forEach((button, index) => {
    button.disabled = true;

    if (index === question.answer) {
      button.classList.add("selected");
    }
  });

  $("checkBtn").classList.add("hidden");
  $("nextBtn").classList.remove("hidden");

  $("nextBtn").textContent =
    questionIndex === lessons[subject].questions.length - 1
      ? "See My Results 🏆"
      : "Next Question ➜";
}

function nextQuestion() {
  const subject = $("subjectSelect").value;
  const questions = lessons[subject].questions;

  if (questionIndex < questions.length - 1) {
    questionIndex++;
    renderQuestion();
    return;
  }

  showResults();
}

function showResults() {
  const subject = $("subjectSelect").value;
  const lesson = lessons[subject];
  const total = lesson.questions.length;
  const percentage = Math.round((score / total) * 100);

  $("lessonTitle").textContent = "🏆 Lesson Complete!";
  $("lessonContent").textContent =
    `You finished ${lesson.name}: ${lesson.title}. ` +
    `You scored ${score} out of ${total} (${percentage}%).`;

  $("quizArea").innerHTML = "";
  $("feedback").textContent =
    percentage === 100
      ? "🌟 Perfect score! Amazing work!"
      : percentage >= 60
        ? "👏 Great effort! Keep practising!"
        : "💪 Keep learning. Try the lesson again!";

  $("checkBtn").classList.add("hidden");
  $("nextBtn").textContent = "Try Again 🔄";
  $("nextBtn").classList.remove("hidden");

  // The next click restarts the selected lesson.
  $("nextBtn").onclick = () => {
    $("nextBtn").onclick = nextQuestion;
    startLearning();
  };
}

$("startBtn").addEventListener("click", startLearning);
$("checkBtn").addEventListener("click", checkAnswer);
$("nextBtn").addEventListener("click", nextQuestion);

$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");

  $("themeBtn").textContent = document.body.classList.contains("dark")
    ? "☀️"
    : "🌙";
});
