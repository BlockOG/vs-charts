const difficulty_colors = [0x1aff55, 0x1ab9ff, 0xff1a4a, 0xc342ff, 0xff006e];
const fallback_color = 0x808080;
const difficulty_names = ["opening", "middle", "finale", "encore", "backstage"];

const score_rating_pw = [[600000, -6.5], [950000, 0.5], [980000, 1], [1000000, 2], [1008000, 2.8], [1010000, 2.8]];
const exscore_rating_pw = [[0.8, 0.25], [0.9, 0.5], [0.93, 0.7], [0.96, 0.85], [0.98, 0.95], [0.99, 0.98], [1, 1]];

function ratingFromScore(cc, score, bonus) {
    let res = -Infinity;
    for (let i = 0; i < score_rating_pw.length - 1; i++) {
        if (score_rating_pw[i][0] <= score) res = score_rating_pw[i][1] + (score - score_rating_pw[i][0]) / (score_rating_pw[i + 1][0] - score_rating_pw[i][0]) * (score_rating_pw[i + 1][1] - score_rating_pw[i][1]);
    }

    return Math.max(0, cc + res) * 1000 + bonus * 100;
}

function scoreFromRating(cc, rating, bonus) {
    if (rating === 0) return 0;
    
    rating = (rating - bonus * 100) / 1000 - cc;
    if (score_rating_pw[score_rating_pw.length - 1][1] < rating || rating < score_rating_pw[0][1]) return;

    let res = 0;
    for (let i = 0; i < score_rating_pw.length - 1; i++) {
        if (score_rating_pw[i][1] <= rating) res = score_rating_pw[i][0] + (rating - score_rating_pw[i][1]) / (score_rating_pw[i + 1][1] - score_rating_pw[i][1]) * (score_rating_pw[i + 1][0] - score_rating_pw[i][0]);
    }

    return res;
}

function ratingFromEXScore(cc, exscore) {
    let res = 0;
    for (let i = 0; i < exscore_rating_pw.length - 1; i++) {
        if (exscore_rating_pw[i][0] <= exscore) res = exscore_rating_pw[i][1] + (exscore - exscore_rating_pw[i][0]) / (exscore_rating_pw[i + 1][0] - exscore_rating_pw[i][0]) * (exscore_rating_pw[i + 1][1] - exscore_rating_pw[i][1]);
    }

    return res * cc * 100;
}

function exScoreFromRating(cc, rating) {
    rating /= cc * 100;
    
    let res = 0;
    for (let i = 0; i < exscore_rating_pw.length - 1; i++) {
        if (exscore_rating_pw[i][1] <= rating) res = exscore_rating_pw[i][0] + (rating - exscore_rating_pw[i][1]) / (exscore_rating_pw[i + 1][1] - exscore_rating_pw[i][1]) * (exscore_rating_pw[i + 1][0] - exscore_rating_pw[i][0]);
    }

    return res;
}

function defaultIfNaN(v, d) {
    return isNaN(v) ? d : v;
}

const stateProto = Object.getPrototypeOf(van.state());
function val(v) {
    const protoOfV = Object.getPrototypeOf(v ?? 0);
    if (protoOfV === stateProto) return v.val;
    if (protoOfV === Function.prototype) return v();
    return v;
}

van.savedState = function (id, default_value, loadFunc = (v) => v, saveFunc = (v) => v) {
    const s = van.state(loadFunc(localStorage.getItem(id) ?? saveFunc(default_value)));
    van.derive(() => localStorage.setItem(id, saveFunc(s.val)));
    return s;
};

function nonInterferingInput(...args) {
    let elem;
    if (args.length >= 1 && typeof args[0] === "object" && args[0].hasOwnProperty("value")) {
        const v = args[0].value;
        args[0].value = (cv) => {
            const nv = val(v);
            if (document.activeElement === elem && document.hasFocus()) {
                return cv;
            } else {
                return nv;
            }
        };
    }

    elem = input(...args);
    return elem;
}

function createBMPDataUrl(pixels) {
    // integer to little endian hex
    function itleh(int) {
        const hex = int.toString(16).padStart(8, "0");
        return hex.slice(6, 8) + hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2);
    }

    const width = pixels[0].length;
    const height = pixels.length;

    let hex = "424D";
    hex += itleh(70 + 4 * width * height);
    hex += "000000007A0000006C000000";
    hex += itleh(width);
    hex += itleh(0x100000000 - height);
    hex += "0100200003000000";
    hex += itleh(4 * width * height);
    hex +=
        "130B0000130B00000000000000000000FF00000000FF00000000FF00000000FF206E6957000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    for (const row of pixels) {
        for (const pixel of row) {
            hex += pixel.padEnd(8, "FF");
        }
        for (let i = row.length; i < width; i++) hex += "00000000";
    }

    return `data:image/bmp;base64,${Uint8Array.fromHex(hex).toBase64()}`;
}
