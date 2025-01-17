const difficulty_colors = [0x1aff55, 0x1ab9ff, 0xff1a4a, 0xc342ff];
const fallback_color = 0x808080;
const difficulty_names = ["opening", "middle", "finale", "encore"];

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
    else if (rating == 0) return 0;

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
    console.log(v);
    return isNaN(v) ? d : v;
}

const stateProto = Object.getPrototypeOf(van.state());
function val(v) {
    const protoOfV = Object.getPrototypeOf(v ?? 0);
    if (protoOfV === stateProto) return v.val;
    if (protoOfV === Function.prototype) return v();
    return v;
}

van.savedState = function (id, default_value) {
    let s = van.state(localStorage.getItem(id) === undefined ? default_value : default_value.constructor(localStorage.getItem(id)));
    van.derive(() => localStorage.setItem(id, s.val));
    return s;
};

function nonInterferingInput(...args) {
    let elem;
    if (args.length >= 1 && typeof args[0] === "object" && args[0].hasOwnProperty("value")) {
        let v = args[0].value;
        args[0].value = (cv) => {
            let nv = val(v);
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
