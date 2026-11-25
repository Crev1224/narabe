// ===== 設定 =====
const MIN_PLAYERS = 2;   // 最低人数
const MAX_PLAYERS = 10;  // 最大人数(5人までにしたいときは、ここを5にします)
const STORAGE_KEY = "nanarabe-counter-v1"; // 保存するときの名札(変えると、保存データが読めなくなります)

// ===== データ =====
// players は「プレイヤーの一覧」です。1人分は { name: 名前, count: パス回数 } という形です。
let players = [];
// いま選んでいるプレイヤーが、一覧の何番目か(0が1人目)
let selected = 0;

// 最初の5人分を作る関数(関数 = 名前を付けた作業のまとまり)
function makeDefaultPlayers() {
  const list = [];
  for (let i = 1; i <= 5; i++) {
    list.push({ name: "プレイヤー" + i, count: 0 });
  }
  return list;
}

// ===== 保存と読み込み =====
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  } catch (e) {
    console.log("保存できませんでした", e);
  }
}

function loadData() {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text === null) {
      return makeDefaultPlayers();
    }
    const data = JSON.parse(text);
    if (!Array.isArray(data) || data.length < MIN_PLAYERS || data.length > MAX_PLAYERS) {
      return makeDefaultPlayers();
    }
    const cleaned = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (typeof item.name !== "string" || !Number.isInteger(item.count) || item.count < 0) {
        return makeDefaultPlayers();
      }
      cleaned.push({ name: item.name.slice(0, 12), count: item.count });
    }
    return cleaned;
  } catch (e) {
    return makeDefaultPlayers();
  }
}

// ===== HTMLの部品を取得 =====
const listEl = document.getElementById("player-list");
const detailLabel = document.getElementById("detail-label");
const detailCount = document.getElementById("detail-count");
const detailName = document.getElementById("detail-name");
const resetOneBtn = document.getElementById("reset-one");
const removeOneBtn = document.getElementById("remove-one");
const addBtn = document.getElementById("add-player");
const openSettingsBtn = document.getElementById("open-settings");
const settingsDialog = document.getElementById("settings");
const resetAllBtn = document.getElementById("reset-all");
const closeSettingsBtn = document.getElementById("close-settings");

// 画面が狭い(スマホ)かどうかを調べる道具
const narrowQuery = window.matchMedia("(max-width: 699px)");

// ===== 名前の表示用の補助 =====
// 名前が空のときは「P1」のように番号で表す
function fullName(p, index) {
  return p.name.trim() === "" ? "P" + (index + 1) : p.name;
}

// カードの上に出す名前。スマホでは「プレイヤー1」を「P1」と短くする
function cardTitle(p, index) {
  const name = fullName(p, index);
  if (narrowQuery.matches) {
    const m = name.match(/^プレイヤー(\d+)$/);
    if (m) {
      return "P" + m[1];
    }
  }
  return name;
}

// 使われていない「プレイヤー〇」の名前を探す(追加するときに使う)
function newPlayerName() {
  let n = 1;
  while (players.some(function (p) { return p.name === "プレイヤー" + n; })) {
    n++;
  }
  return "プレイヤー" + n;
}

// ボタンを1つ作る補助の関数
function makeButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

// ===== 画面を描き直す関数 =====
// 上のプレイヤーのカードを作る
function renderCards() {
  listEl.innerHTML = "";

  players.forEach(function (p, index) {
    const card = document.createElement("div");
    // c0〜c4 は色の名前(5色をくり返す)。選んでいるカードには selected を付ける
    card.className = "player c" + (index % 5) + (index === selected ? " selected" : "");

    // カードのどこかを押したら、その人を選ぶ(ボタンを押したときは別の動き)
    card.addEventListener("click", function (event) {
      if (event.target.closest("button")) {
        return;
      }
      selected = index;
      render();
    });

    const head = document.createElement("div");
    head.className = "player-head";
    head.textContent = cardTitle(p, index);

    const count = document.createElement("div");
    count.className = "player-count";
    count.textContent = p.count;

    const btns = document.createElement("div");
    btns.className = "player-btns";

    const minusBtn = makeButton("−1", "minus", function () {
      selected = index;
      if (p.count > 0) {
        p.count--;
      }
      render();
    });

    const plusBtn = makeButton("+1", "plus", function () {
      selected = index;
      p.count++;
      render();
    });

    btns.appendChild(minusBtn);
    btns.appendChild(plusBtn);

    card.appendChild(head);
    card.appendChild(count);
    card.appendChild(btns);
    listEl.appendChild(card);
  });
}

// 下の、選んでいるプレイヤーの大きな表示を更新する
function renderDetail() {
  const p = players[selected];
  detailLabel.textContent = fullName(p, selected) + "のパス回数";
  detailCount.textContent = p.count;
  // 入力中の文字を邪魔しないよう、違うときだけ入れ替える
  if (detailName.value !== p.name) {
    detailName.value = p.name;
  }
  removeOneBtn.disabled = players.length <= MIN_PLAYERS;
  addBtn.disabled = players.length >= MAX_PLAYERS;
}

// 画面全体を描き直して、保存する
function render() {
  renderCards();
  renderDetail();
  saveData();
}

// 画面の幅が変わって、スマホ表示とPC表示が切り替わったときも描き直す
narrowQuery.addEventListener("change", render);

// ===== 操作の動き =====
// 名前を書き換えたとき
detailName.addEventListener("input", function () {
  players[selected].name = detailName.value;
  render();
});

// 選んでいるプレイヤーのリセット
resetOneBtn.addEventListener("click", function () {
  const p = players[selected];
  if (confirm(fullName(p, selected) + " のパス回数を0に戻しますか?")) {
    p.count = 0;
    render();
  }
});

// 選んでいるプレイヤーの削除
removeOneBtn.addEventListener("click", function () {
  if (players.length <= MIN_PLAYERS) {
    return;
  }
  const p = players[selected];
  if (confirm(fullName(p, selected) + " を削除しますか?")) {
    players.splice(selected, 1);
    // 最後の人を消したときは、1つ前の人を選ぶ
    if (selected >= players.length) {
      selected = players.length - 1;
    }
    render();
  }
});

// プレイヤーの追加
addBtn.addEventListener("click", function () {
  if (players.length < MAX_PLAYERS) {
    players.push({ name: newPlayerName(), count: 0 });
    selected = players.length - 1; // 追加した人を選ぶ
    render();
  }
});

// 歯車(設定画面)
openSettingsBtn.addEventListener("click", function () {
  settingsDialog.showModal();
});

closeSettingsBtn.addEventListener("click", function () {
  settingsDialog.close();
});

// 全員リセット
resetAllBtn.addEventListener("click", function () {
  if (confirm("全員のパス回数を0に戻しますか?(名前は変わりません)")) {
    players.forEach(function (p) {
      p.count = 0;
    });
    render();
    settingsDialog.close();
  }
});

// ===== 起動時の処理 =====
players = loadData(); // 前回の状態を読み込む(無ければ初期状態)
selected = 0;
render();