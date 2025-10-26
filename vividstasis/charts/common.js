const difficulty_colors = [0x1aff55, 0x1ab9ff, 0xff1a4a, 0xc342ff, 0xff006e];
const fallback_color = 0x808080;
const difficulty_names = ["opening", "middle", "finale", "encore", "backstage"];

function ratingFromScore(cc, score, bonus) {
    let res = -Infinity;
    if (1008000 <= score) res = 1800;
    else if (1000000 <= score) res = 1000 + (800 * (score - 1000000)) / 8000;
    else if (980000 <= score) res = (1000 * (score - 980000)) / 20000;
    else if (950000 <= score) res = -1000 + (1000 * (score - 950000)) / 30000;
    else if (600000 <= score) res = -8000 + (7000 * (score - 600000)) / 350000;

    return Math.max(0, cc * 1000 + res) + bonus * 100;
}

function scoreFromRating(cc, rating, bonus) {
    if (rating < 0) return;
    else if (rating === 0) return 0;

    rating -= Math.max(0, cc * 1000) + bonus * 100;

    let res = 0;
    if (1800 < rating) return;
    else if (1000 <= rating) res = 1000000 + (8000 * (rating - 1000)) / 800;
    else if (0 <= rating) res = 980000 + (20000 * rating) / 1000;
    else if (-1000 <= rating) res = 950000 + (30000 * (rating - -1000)) / 1000;
    else if (-8000 <= rating) res = 600000 + (350000 * (rating - -8000)) / 7000;
    else return;

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
