const difficulty_colors = [0x1aff55, 0x1ab9ff, 0xff1a4a, 0xc342ff];
const fallback_color = 0x808080;
const difficulty_names = ["opening", "middle", "finale", "encore"];

function ratingFromScore(cc, score, bonus) {
    let res = -Infinity;
    if (1008000 <= score) res = 1800;
    else if (1000000 <= score) res = 1000 + 800 * (score - 1000000) / 8000;
    else if (980000 <= score) res = 1000 * (score - 980000) / 20000;
    else if (950000 <= score) res = -1000 + 1000 * (score - 950000) / 30000
    else if (600000 <= score) res = -8000 + 7000 * (score - 600000) / 350000;

    return Math.max(0, cc * 1000 + res) + bonus * 100;
}

function scoreFromRating(cc, rating, bonus) {
    if (rating < 0) return;
    else if (rating == 0) return 0;

    rating -= Math.max(0, cc * 1000) + bonus * 100;

    let res = 0;
    if (1800 < rating) return;
    else if (1000 <= rating) res = 1000000 + 8000 * (rating - 1000) / 800;
    else if (0 <= rating) res = 980000 + 20000 * rating / 1000;
    else if (-1000 <= rating) res = 950000 + 30000 * (rating - -1000) / 1000;
    else if (-8000 <= rating) res = 600000 + 350000 * (rating - -8000) / 7000;
    else return;

    return res;
}
