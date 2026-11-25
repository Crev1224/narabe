// ===== 設定 =====
const MIN_PLAYERS = 2;   // 最低人数
const MAX_PLAYERS = 10;  // 最大人数
const STORAGE_KEY = "nanarabe-counter-v1"; // 保存するときの名前(データの置き場所の名札)

// ===== データ =====
// players は「プレイヤーの一覧」です。1人分は { name: 名前, count: パス回数 } という形です。
let players = [];

// 最初の5人分を作る関数(関数 = 名前を付けた作業のまとまり)
function makeDefaultPlayers() {
  const list = [];
  for (let i = 1; i <= 5; i++) {
    list.push({ name: "プレイヤー" + i, count: 0 });
  }
  return list;
}

// ===== 保存と読み込み =====
// 今のデータを保存する
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  } catch (e) {
    // 保存できなくてもアプリは止めない(カウント自体は続けられる)
    console.log("保存できませんでした", e);
  }
}

// 保存されたデータを読み込む。うまくいかなければ初期状態を返す
function loadData() {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text === null) {
      return makeDefaultPlayers(); // 初めて起動したとき
    }
    const data = JSON.parse(text);

    // データが正しい形か確認する(壊れていたら使わない)
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
const addBtn = document.getElementById("add-player");
const resetAllBtn = document.getElementById("reset-all");

// ボタンを1つ作る補助の関数
function makeButton(text, className, onClick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.className = className;
  button.addEventListener("click", onClick); // 押されたときの動作を登録
  return button;
}

// ===== 画面を描き直す関数 =====
function render() {
  listEl.innerHTML = ""; // いったん空にする

  players.forEach(function (p, index) {
    // カード全体
    const card = document.createElement("div");
    card.className = "player";

    // 上の段:名前入力、リセット、削除
    const top = document.createElement("div");
    top.className = "player-top";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "name";
    nameInput.value = p.name;
    nameInput.maxLength = 12;
    // 文字を入力するたびに、名前をデータへ反映して保存する
    nameInput.addEventListener("input", function () {
      p.name = nameInput.value;
      saveData();
    });

    const resetBtn = makeButton("リセット", "small-btn", function () {
      if (confirm(p.name + " のパス回数を0に戻しますか?")) {
        p.count = 0;
        render();
      }
    });

    const removeBtn = makeButton("削除", "small-btn remove", function () {
      if (confirm(p.name + " を削除しますか?")) {
        players.splice(index, 1); // 一覧から1人分を取り除く
        render();
      }
    });
    // 最低人数のときは、削除ボタンを押せなくする
    removeBtn.disabled = players.length <= MIN_PLAYERS;

    top.appendChild(nameInput);
    top.appendChild(resetBtn);
    top.appendChild(removeBtn);

    // 下の段:パス回数、-1、+1
    const bottom = document.createElement("div");
    bottom.className = "player-bottom";

    const count = document.createElement("div");
    count.className = "count";
    count.textContent = p.count;

    const minusBtn = makeButton("−1", "minus", function () {
      if (p.count > 0) {
        p.count--;
        render();
      }
    });

    const plusBtn = makeButton("+1", "plus", function () {
      p.count++;
      render();
    });

    bottom.appendChild(count);
    bottom.appendChild(minusBtn);
    bottom.appendChild(plusBtn);

    card.appendChild(top);
    card.appendChild(bottom);
    listEl.appendChild(card);
  });

  // 最大人数のときは、追加ボタンを押せなくする
  addBtn.disabled = players.length >= MAX_PLAYERS;

  // 画面を描き直すたびに、自動で保存する
  saveData();
}

// ===== 画面下のボタンの動作 =====
addBtn.addEventListener("click", function () {
  if (players.length < MAX_PLAYERS) {
    players.push({ name: "プレイヤー" + (players.length + 1), count: 0 });
    render();
  }
});

resetAllBtn.addEventListener("click", function () {
  if (confirm("全員のパス回数を0に戻しますか?(名前は変わりません)")) {
    players.forEach(function (p) {
      p.count = 0;
    });
    render();
  }
});

// ===== 起動時の処理 =====
players = loadData(); // 前回の状態を読み込む(無ければ初期状態)
render();