let game = null;
let questions = [];
let answeredKey = null;
let lastQuestionKey = null;

async function load() {
  const code = getGameCode();
  const playerId = getPlayerId();

  if (!code || !playerId) {
    location.href = "index.html";
    return;
  }

  try {
    game = await getGameByCode(code);
    questions = await getQuestions();

    $("#playerName").textContent = getPlayerName();

    renderState();

    supabaseClient
      .channel("game-" + game.id)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`
        },
        payload => {
          const oldKey = `${game.phase}:${game.current_question_id}`;
          const newGame = payload.new;
          const newKey = `${newGame.phase}:${newGame.current_question_id}`;

          game = newGame;

          // Mudou de pergunta ou de fase: libera uma nova resposta.
          if (oldKey !== newKey) {
            answeredKey = null;
            lastQuestionKey = newKey;
          }

          renderState();
        }
      )
      .subscribe();

  } catch (error) {
    console.error(error);
    alert("Não foi possível carregar a partida.");
  }
}

function renderState() {
  const phaseText = game.phase === "personagem" ? "🎭 PERSONAGEM" : "🧑 EU";
  $("#phase").textContent = phaseText;

  if (game.status !== "question") {
    $("#waiting").hidden = false;
    $("#answerArea").hidden = true;

    if (game.status === "finished") {
      $("#waitingTitle").textContent = "Partida encerrada!";
      $("#waitingText").textContent = "Seu resultado está sendo preparado...";
      setTimeout(() => {
        location.href = `resultado.html?game=${game.id}`;
      }, 700);
    } else if (game.status === "reveal") {
      $("#waitingTitle").textContent = "Resposta enviada ✓";
      $("#waitingText").textContent = "Olhe para a tela e participe da conversa.";
    } else {
      $("#waitingTitle").textContent = "Tudo pronto!";
      $("#waitingText").textContent = "Aguarde o professor liberar a próxima situação.";
    }

    return;
  }

  const q = questions.find(x => x.id === game.current_question_id);
  if (!q) return;

  const questionKey = `${game.phase}:${game.current_question_id}`;

  if (lastQuestionKey !== questionKey) {
    answeredKey = null;
    lastQuestionKey = questionKey;
  }

  $("#waiting").hidden = true;
  $("#answerArea").hidden = false;

  $("#round").textContent = `RODADA ${q.number} DE ${questions.length}`;
  $("#questionTitle").textContent = q.title;
  $("#questionHint").textContent =
    game.phase === "personagem"
      ? "Responda pensando no personagem que você criou."
      : "Agora responda pensando em você.";

  $("#progressFill").style.width = `${(q.number / questions.length) * 100}%`;

  if (answeredKey) {
    renderAnswered(q);
  } else {
    renderOptions(q);
  }
}

function renderOptions(q) {
  $("#sent").hidden = true;
  $("#buttons").hidden = false;

  $("#buttons").innerHTML = q.options
    .map(
      option => `
        <button class="answer-btn" data-key="${option.key}">
          <span class="answer-letter">${option.key}</span>
          <span class="answer-text">${escapeHtml(option.text)}</span>
          <span class="answer-arrow">→</span>
        </button>
      `
    )
    .join("");

  document.querySelectorAll(".answer-btn").forEach(button => {
    button.addEventListener("click", () => sendAnswer(q, button.dataset.key));
  });
}

function renderAnswered(q) {
  const selected = q.options.find(o => o.key === answeredKey);

  $("#buttons").hidden = false;
  $("#buttons").innerHTML = q.options
    .map(
      option => `
        <div class="answer-btn ${
          option.key === answeredKey ? "selected" : "disabled-option"
        }">
          <span class="answer-letter">${option.key}</span>
          <span class="answer-text">${escapeHtml(option.text)}</span>
          <span class="answer-status">
            ${option.key === answeredKey ? "✓ ESCOLHIDA" : ""}
          </span>
        </div>
      `
    )
    .join("");

  $("#sent").hidden = false;
  $("#sent").innerHTML = `
    <div class="sent-icon">✓</div>
    <strong>Resposta registrada!</strong>
    <span>Você escolheu a alternativa ${answeredKey}.</span>
    <small>Aguarde a próxima situação.</small>
  `;
}

async function sendAnswer(q, key) {
  if (answeredKey) return;

  const button = document.querySelector(`.answer-btn[data-key="${key}"]`);
  if (button) {
    button.classList.add("pressing");
    button.disabled = true;
  }

  const option = q.options.find(o => o.key === key);
  if (!option) return;

  const playerId = getPlayerId();

  try {
    const { error } = await supabaseClient
      .from("answers")
      .insert({
        game_id: game.id,
        player_id: playerId,
        question_id: q.id,
        phase: game.phase,
        option_key: key,
        scores: option.scores
      });

    if (error) {
      console.error(error);
      if (button) {
        button.classList.remove("pressing");
        button.disabled = false;
      }
      alert("Não foi possível registrar sua resposta. Tente novamente.");
      return;
    }

    // Só marcamos como respondida DEPOIS do INSERT no Supabase.
    answeredKey = key;
    renderAnswered(q);

  } catch (error) {
    console.error(error);
    if (button) {
      button.classList.remove("pressing");
      button.disabled = false;
    }
    alert("Erro ao enviar a resposta.");
  }
}

load();
