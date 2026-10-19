(() => {
  let acertos = 0;
  let timeLeft = 1500;
  let timerInterval = null;
  let totalEstacoes = 0;
  let revealed = new Set();

  const screenStart = document.getElementById("screen-start");
  const screenGame = document.getElementById("screen-game");
  const screenEnd = document.getElementById("screen-end");
  const scoreCorrectEl = document.getElementById("score-correct");
  const timerEl = document.getElementById("timer");
  const answerInput = document.getElementById("answer-input");
  const feedbackEl = document.getElementById("feedback");
  const coversLayer = document.getElementById("covers-layer");
  const revealedUl = document.getElementById("revealed-ul");
  const linesTable = document.getElementById("lines-table");

  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-restart").addEventListener("click", startGame);
  document.getElementById("btn-confirm").addEventListener("click", checkAnswer);
  document.getElementById("btn-giveup").addEventListener("click", giveUp);

  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkAnswer();
  });

  // Seleção de tempo
  document.querySelectorAll(".time-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".time-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  function show(screen) {
    [screenStart, screenGame, screenEnd].forEach(s => s.classList.remove("active"));
    screen.classList.add("active");
  }

  function normalize(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[–—\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Estações que são a mesma (nomes diferentes, mesma estação física)
  // Digitar qualquer um dos nomes revela todos do grupo
  const IRMAS = [
    ["Consolação", "Paulista"],
    // Adicione mais pares aqui se precisar
  ];

  function getIrmas(nome) {
    for (const grupo of IRMAS) {
      if (grupo.includes(nome)) return grupo;
    }
    return [nome];
  }

  function findMatch(input) {
    const ni = normalize(input);
    if (ni.length < 2) return null;

    for (const est of ESTACOES) {
      if (revealed.has(est.nome)) continue;

      const nt = normalize(est.nome);

      if (ni === nt) return est;

      // Match parcial pra nomes compostos (com – ou espaço)
      const parts = nt.split(/[\s]+/);
      for (const part of parts) {
        if (part.length >= 4 && ni === part) return est;
      }

      // Checar se o input bate com uma estação irmã
      const irmas = getIrmas(est.nome);
      for (const irma of irmas) {
        if (normalize(irma) === ni) return est;
      }

      // Tolerância de 1 caractere
      if (Math.abs(ni.length - nt.length) <= 1 && ni.length >= 4) {
        let diff = 0;
        const longer = ni.length >= nt.length ? ni : nt;
        const shorter = ni.length < nt.length ? ni : nt;
        let j = 0;
        for (let i = 0; i < longer.length && j < shorter.length; i++) {
          if (longer[i] !== shorter[j]) {
            diff++;
            if (ni.length === nt.length) j++;
          } else {
            j++;
          }
        }
        if (diff <= 1) return est;
      }
    }
    return null;
  }

  function createCovers() {
    coversLayer.innerHTML = "";
    for (const est of ESTACOES) {
      const cover = document.createElement("div");
      cover.className = "name-cover";
      cover.style.left = est.x + "%";
      cover.style.top = est.y + "%";
      cover.style.width = est.w + "%";
      cover.style.height = est.h + "%";
      if (est.r) {
        cover.style.transform = `rotate(${est.r}deg)`;
      }
      cover.dataset.station = est.nome;
      coversLayer.appendChild(cover);
    }
  }

  function revealStation(nome) {
    const covers = coversLayer.querySelectorAll(`[data-station="${nome}"]`);
    covers.forEach(c => c.classList.add("revealed"));
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function updateTimer() {
    timerEl.textContent = formatTime(timeLeft);
    const timerBar = document.querySelector(".timer-bar");
    timerBar.classList.remove("warning", "danger");
    if (timeLeft <= 30) timerBar.classList.add("danger");
    else if (timeLeft <= 120) timerBar.classList.add("warning");
  }

  // Contar estações por linha
  function getLineStats() {
    const stats = {};
    for (const linha of LINHAS) {
      stats[linha.id] = { total: 0, acertadas: 0 };
    }
    for (const est of ESTACOES) {
      for (const lid of est.linhas) {
        if (stats[lid]) stats[lid].total++;
      }
    }
    for (const est of ESTACOES) {
      if (revealed.has(est.nome)) {
        for (const lid of est.linhas) {
          if (stats[lid]) stats[lid].acertadas++;
        }
      }
    }
    return stats;
  }

  function renderLinesProgress() {
    const stats = getLineStats();
    linesTable.innerHTML = "";

    for (const linha of LINHAS) {
      const s = stats[linha.id];
      if (s.total === 0) continue;

      const row = document.createElement("div");
      row.className = "line-progress-row";
      if (s.acertadas >= s.total) row.classList.add("complete");

      row.innerHTML = `
        <span class="line-dot" style="background:${linha.cor}"></span>
        <span class="line-name">${linha.nome.replace("Linha ", "")}</span>
        <span class="line-progress-bar"><span class="fill" style="width:${(s.acertadas/s.total)*100}%;background:${linha.cor}"></span></span>
        <span class="line-count">${s.acertadas}/${s.total}</span>
      `;
      linesTable.appendChild(row);
    }
  }

  function checkAnswer() {
    const input = answerInput.value.trim();
    if (!input) return;

    const match = findMatch(input);

    if (match) {
      // Revelar todas as estações irmãs
      const irmas = getIrmas(match.nome);
      let revealCount = 0;

      for (const nome of irmas) {
        if (!revealed.has(nome)) {
          revealed.add(nome);
          revealStation(nome);
          revealCount++;
          // Adicionar na lista cada estação irmã revelada
          const est = ESTACOES.find(e => e.nome === nome);
          if (est) addToList(est.nome, est.linhas);
        }
      }

      acertos += revealCount;
      scoreCorrectEl.textContent = acertos;
      renderLinesProgress();

      const nomesRevelados = irmas.filter(n => revealCount > 1 || n === match.nome).join(" + ");
      feedbackEl.textContent = `✅ ${nomesRevelados}`;
      feedbackEl.className = "feedback correct";
      answerInput.value = "";
      answerInput.focus();

      if (revealed.size >= totalEstacoes) {
        endGame(true);
      }
    } else {
      feedbackEl.textContent = "❌ Não encontrada ou já revelada";
      feedbackEl.className = "feedback wrong";
      answerInput.select();
    }
  }

  function giveUp() {
    if (!confirm("Tem certeza que quer desistir?")) return;
    endGame(false);
  }

  function addToList(nome, linhas) {
    const li = document.createElement("li");
    li.textContent = nome + " ";
    for (const lid of linhas) {
      const linha = LINHAS.find(l => l.id === lid);
      if (linha) {
        const tag = document.createElement("span");
        tag.className = "line-tag";
        tag.style.background = linha.cor;
        tag.textContent = linha.id.split("-")[0];
        li.appendChild(tag);
      }
    }
    revealedUl.prepend(li);
  }

  function endGame(allDone) {
    clearInterval(timerInterval);
    show(screenEnd);

    document.getElementById("final-correct").textContent = acertos;
    document.getElementById("final-skip").textContent = totalEstacoes - acertos;
    document.getElementById("final-total").textContent = totalEstacoes;

    if (allDone) {
      document.getElementById("end-title").textContent = "🎉 Todas as estações!";
    } else if (timeLeft <= 0) {
      document.getElementById("end-title").textContent = "⏱️ Tempo esgotado!";
    } else {
      document.getElementById("end-title").textContent = "🏳️ Você desistiu!";
    }

    renderEndDetail();
  }

  function renderEndDetail() {
    const container = document.getElementById("end-lines-detail");
    container.innerHTML = "";

    // Agrupar estações por linha
    for (const linha of LINHAS) {
      const estacoesDaLinha = ESTACOES.filter(e => e.linhas.includes(linha.id));
      if (estacoesDaLinha.length === 0) continue;

      const section = document.createElement("div");
      section.className = "end-line-section";

      const acertadasLinha = estacoesDaLinha.filter(e => revealed.has(e.nome)).length;

      const header = document.createElement("div");
      header.className = "end-line-header";
      header.style.background = linha.cor;
      header.textContent = `${linha.nome} — ${acertadasLinha}/${estacoesDaLinha.length}`;
      section.appendChild(header);

      const stationsDiv = document.createElement("div");
      stationsDiv.className = "end-line-stations";

      for (const est of estacoesDaLinha) {
        const tag = document.createElement("span");
        tag.className = "end-station";
        tag.textContent = est.nome;
        if (!revealed.has(est.nome)) {
          tag.classList.add("missed");
        }
        stationsDiv.appendChild(tag);
      }

      section.appendChild(stationsDiv);
      container.appendChild(section);
    }
  }

  function startGame() {
    const selectedBtn = document.querySelector(".time-btn.selected");
    timeLeft = parseInt(selectedBtn?.dataset.time || "1500");

    acertos = 0;
    revealed = new Set();
    scoreCorrectEl.textContent = "0";
    revealedUl.innerHTML = "";
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    totalEstacoes = ESTACOES.length;
    document.getElementById("score-total").textContent = totalEstacoes;

    show(screenGame);
    createCovers();
    renderLinesProgress();
    updateTimer();
    answerInput.value = "";
    answerInput.focus();

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) {
        endGame(false);
      }
    }, 1000);
  }
})();
