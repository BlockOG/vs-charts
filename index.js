const difficulty_colors = [0x1aff55, 0x1ab9ff, 0xff1a4a, 0xc342ff];

const rendered_result = document.getElementById("rendered-result");
const rendered_result_ctx = rendered_result.getContext("2d");

const level_range_start = document.getElementById("level-range-start");
const level_range_end = document.getElementById("level-range-end");

const difficulties = [
  document.getElementById("difficulty-opening"),
  document.getElementById("difficulty-middle"),
  document.getElementById("difficulty-finale"),
  document.getElementById("difficulty-encore"),
];

const copy_result = document.getElementById("copy-result");
const copy_done = document.getElementById("done");
const copy_failed = document.getElementById("failed");

const song_jackets = {};
let song_data;

const num_font_data = {
  ".": [0, 1],
  0: [1, 5],
  1: [6, 2],
  2: [8, 5],
  3: [13, 5],
  4: [18, 5],
  5: [23, 5],
  6: [28, 5],
  7: [33, 5],
  8: [38, 5],
  9: [43, 5],
};
let num_font;

function verifyLevel(level) {
  let dot = false;
  for (let i of level) {
    if (i == ".") {
      if (dot) return false;
      dot = true;
    } else if (!"0123456789".includes(i)) {
      return false;
    }
  }

  return true;
}

function renderResult() {
  if (!song_data) return;

  let level_range = [
    level_range_start.value == ""
      ? -Infinity
      : parseFloat(level_range_start.value) || 0,
    level_range_end.value == ""
      ? Infinity
      : parseFloat(level_range_end.value) || 0,
  ];

  let levels = {};
  for (let i in song_data) {
    let song = song_data[i];
    i = parseInt(i);
    let song_difficulties = song["difficulties"];
    for (let j in song_difficulties) {
      if (!difficulties[j].checked) continue;
      let level = song_difficulties[j];
      if (level_range[0] > level || level > level_range[1]) continue;

      let level_string = level.toFixed(1);
      if (!levels[level_string]) levels[level_string] = [];
      levels[level_string].push([song["file_name"], parseInt(j), i]);
    }
  }

  let before_dot = 0;
  let after_dot = 0;
  let max_level_charts = 0;

  let level_widths = {};
  let sorted_levels = [];

  for (let level in levels) {
    let level_charts = levels[level];
    level_charts.sort((a, b) => (a[1] == b[1] ? a[2] - b[2] : a[1] - b[1]));
    if (level_charts.length > max_level_charts)
      max_level_charts = level_charts.length;

    let curr_before_dot = 0;
    let curr_after_dot = 0;
    let dot = false;
    for (let i in level) {
      if (level[i] == ".") {
        dot = true;
      } else if (dot) {
        curr_after_dot += 1 + num_font_data[level[i]][1];
      } else {
        curr_before_dot += num_font_data[level[i]][1] + 1;
      }
    }

    if (curr_before_dot > before_dot) before_dot = curr_before_dot;
    if (curr_after_dot > after_dot) after_dot = curr_after_dot;

    level_widths[level] = [curr_before_dot, curr_after_dot];
    sorted_levels.push([level, parseFloat(level)]);
  }

  rendered_result.width =
    25 + (before_dot + after_dot) * 5 + max_level_charts * 105;
  rendered_result.height = 5 + sorted_levels.length * 105;
  sorted_levels.sort((a, b) => a[1] - b[1]);

  if (num_font) {
    for (let i in sorted_levels) {
      let level = sorted_levels[i][0];
      i = parseInt(i);
      let col = levels[level][0][1];
      let x = 1 + before_dot - level_widths[level][0];
      for (let c of level) {
        rendered_result_ctx.drawImage(
          num_font,
          num_font_data[c][0] * 5,
          35 * col,
          num_font_data[c][1] * 5,
          35,
          x * 5,
          40 + i * 105,
          num_font_data[c][1] * 5,
          35,
        );
        x += num_font_data[c][1] + 1;
      }
    }
  }

  for (let i in sorted_levels) {
    let level = sorted_levels[i][0];
    i = parseInt(i);
    let x = 25 + (before_dot + after_dot) * 5;
    for (let chart of levels[level]) {
      rendered_result_ctx.fillStyle =
        "#" + difficulty_colors[chart[1]].toString(16).padStart(6, "0");
      rendered_result_ctx.fillRect(x - 2, 3 + i * 105, 104, 104);

      if (song_jackets[chart[0]]) {
        rendered_result_ctx.drawImage(song_jackets[chart[0]], x, 5 + i * 105);
      }

      x += 105;
    }
  }
}

function setSearchParams() {
  let url = new URL(window.location);
  url.search = "";

  let level_range = level_range_start.value + "-" + level_range_end.value;
  if (level_range != "-") {
    url.searchParams.set("level-range", level_range);
  }

  let disabled = difficulties.map((i) => 1 - i.checked).join("");
  if (disabled != "0000") {
    url.searchParams.set("disabled", disabled);
  }

  window.history.replaceState(null, null, url);
}

function updateState() {
  setSearchParams();
  renderResult();
}

let url = new URL(window.location);

if (url.searchParams.has("level-range")) {
  let level_range = url.searchParams.get("level-range").split("-");
  if (level_range.length >= 2) {
    if (verifyLevel(level_range[0])) level_range_start.value = level_range[0];
    if (verifyLevel(level_range[1])) level_range_end.value = level_range[1];
  }
}

if (url.searchParams.has("disabled")) {
  let disabled = url.searchParams.get("disabled");
  if (disabled.length >= 4) {
    for (let i = 0; i < 4; i++) {
      if (disabled[i] == "1") {
        difficulties[i].checked = false;
      }
    }
  }
}

let old_level_range_start = level_range_start.value;
let old_level_range_end = level_range_end.value;

level_range_start.addEventListener("input", () => {
  if (verifyLevel(level_range_start.value)) {
    old_level_range_start = level_range_start.value;
    updateState();
  } else level_range_start.value = old_level_range_start;
});
level_range_end.addEventListener("input", () => {
  if (verifyLevel(level_range_end.value)) {
    old_level_range_end = level_range_end.value;
    updateState();
  } else level_range_end.value = old_level_range_end;
});
difficulties.forEach((diff) => diff.addEventListener("input", updateState));

let old_timeout;
copy_result.addEventListener("click", () =>
  rendered_result.toBlob((blob) =>
    navigator.clipboard
      .write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ])
      .then(() => {
        if (old_timeout) clearTimeout(old_timeout);
        copy_done.style = "";
        copy_failed.style = "display: none";
        old_timeout = setTimeout(() => {
          copy_done.style = "display: none";
        }, 2000);
      })
      .catch((r) => {
        console.log(r);
        if (old_timeout) clearTimeout(old_timeout);
        copy_done.style = "display: none";
        copy_failed.style = "";
        old_timeout = setTimeout(() => {
          copy_failed.style = "display: none";
        }, 2000);
      }),
  ),
);

updateState();

fetch("song_data.json").then((data) => {
  data.json().then((data) => {
    song_data = data;
    renderResult();
    for (let song of data) {
      fetch(`jackets/${song["file_name"]}.png`).then((data) => {
        data.blob().then((blob) => {
          createImageBitmap(blob).then((image) => {
            song_jackets[song["file_name"]] = image;
            renderResult();
          });
        });
      });
    }
  });
});

fetch("num_font.png").then((data) => {
  data.blob().then((blob) => {
    createImageBitmap(blob).then((image) => {
      num_font = image;
      renderResult();
    });
  });
});
