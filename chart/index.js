let { a, button, div, img, input, link, span, title } = van.tags;

let url = new URL(window.location);
if (!url.searchParams.has("chart")) window.location.href = "/vs-charts";

const chart = url.searchParams.get("chart");
fetch("/vs-charts/song_data.json").then((data) => {
    data.json().then((data) => {
        for (let song of data) {
            if (song.file_name !== chart) continue;

            const difficulty = van.state(parseInt(url.searchParams.get("diff")) || 0);

            const scroll_speed = van.state(10.0);
            const pixels_per_second = van.derive(() => 100 + 20 * scroll_speed.val);

            const chart_scroller = document.getElementById("chart-scroller");
            const window_height = van.state(chart_scroller.clientHeight);

            const scale = van.savedState("scale", 1, parseFloat);
            if (scale.val <= 0) scale.val = 1;

            const chart_duration = van.derive(() => (difficulty.val === 3 && song.encore_duration) || song.duration);
            const chart_height = van.derive(() => Math.floor(chart_duration.val * pixels_per_second.val * scale.val));
            const current_time = van.state(parseFloat(url.searchParams.get("time")) || 0);
            const current_percentage = van.derive(() => (current_time.val / chart_duration.val) * 100);

            const upscroll = van.savedState("upscroll", false, (v) => v == "true");

            const column_split = van.savedState("column-split", false, (v) => v == "true");
            const column_split_reverse = van.savedState("column-split-reverse", false, (v) => v == "true");

            const score_rating_switch_selection = van.state(true);

            const score_rating_score = van.state(0);
            const score_rating_selection = van.state(0);

            const rating_score_rating = van.state(0);

            van.add(
                document.head,
                title(() => `${song.name} ${difficulty_names[difficulty.val]} ${song.difficulties[difficulty.val].toFixed(1)}`),
                link({ rel: "icon", type: "image/png", href: `/vs-charts/jackets/${chart}.png` })
            );
            van.add(
                document.body,
                () => {
                    if (column_split.val) {
                        let ppb = (pixels_per_second.val / song.bpm) * 60;
                        let split_height = Math.max(Math.floor((window_height.val - 20) / ppb), 1) * ppb;
                        let num_splits = Math.ceil(chart_height.val / split_height);

                        let images = Array.from({ length: num_splits }, (_, i) =>
                            img({
                                class: "chart-image",
                                style: `width: ${91 * scale.val}px; height: ${split_height}px; rotate: ${
                                    upscroll.val * 180
                                }deg; border-left-width: ${scale.val}px; border-right-width: ${
                                    scale.val
                                }px; object-fit: cover; object-position: left 0px bottom ${-split_height * i}px; aspect-ratio: ${
                                    (91 * scale.val) / scale.val
                                }`,
                                src: `/vs-charts/charts/${chart}/${difficulty_names[difficulty.val]}.png`,
                            })
                        );

                        if (column_split_reverse.val) images.reverse();

                        return div(
                            { style: "display: table; position: absolute; top: 0px; height: 100%;" },
                            div(
                                { style: "display: table-cell; vertical-align: middle;" },
                                div(
                                    {
                                        class: "row",
                                        style: `width: ${(93 * scale.val + 50) * num_splits - 50}px; gap: 50px; padding: 0px calc(50vw - ${
                                            (93 * scale.val) / 2
                                        }px)`,
                                    },
                                    images
                                )
                            )
                        );
                    } else {
                        return img({
                            class: "chart-image",
                            style: `width: ${91 * scale.val}px; height: ${chart_height.val}px; rotate: ${
                                upscroll.val * 180
                            }deg; border-left-width: ${scale.val}px; border-right-width: ${scale.val}px`,
                            src: `/vs-charts/charts/${chart}/${difficulty_names[difficulty.val]}.png`,
                        });
                    }
                },
                div(
                    { class: "top-left column" },
                    div(a({ href: "/vs-charts" }, "All charts")),
                    div(`Name: ${song.name}`),
                    div(`BPM: ${song.bpm}`),
                    div(
                        "Scroll speed: ",
                        input({ type: "number", class: "right-aligned", style: "width: 26px", value: scroll_speed, disabled: true })
                    ),
                    div(
                        "Scale: ",
                        nonInterferingInput({
                            type: "number",
                            class: "right-aligned",
                            style: "width: 26px",
                            value: scale,
                            oninput: (v) => {
                                if (v.target.value > 0) scale.val = v.target.value;
                            },
                        })
                    ),
                    div(
                        "Upscroll: ",
                        input({
                            type: "checkbox",
                            checked: upscroll,
                            oninput: (v) => (upscroll.val = v.target.checked),
                        })
                    ),
                    () =>
                        div(
                            "Column split: ",
                            input({
                                type: "checkbox",
                                checked: column_split,
                                oninput: (v) => (column_split.val = v.target.checked),
                            }),
                            column_split.val ? " Reverse: " : undefined,
                            column_split.val
                                ? input({
                                      type: "checkbox",
                                      checked: column_split_reverse,
                                      oninput: (v) => (column_split_reverse.val = v.target.checked),
                                  })
                                : undefined
                        ),
                    div(
                        "Time: ",
                        nonInterferingInput({
                            type: "number",
                            class: "right-aligned",
                            style: "width: 40px",
                            value: () => current_time.val.toFixed(2),
                            oninput: (v) => {
                                if (v.target.value !== "") current_time.val = Math.max(0, Math.min(chart_duration.val, v.target.value));
                            },
                        }),
                        () => `/${chart_duration.val.toFixed(2)} (`,
                        nonInterferingInput({
                            type: "number",
                            class: "right-aligned",
                            style: "width: 40px",
                            value: () => current_percentage.val.toFixed(2),
                            oninput: (v) => {
                                if (v.target.value !== "")
                                    current_time.val = Math.max(
                                        0,
                                        Math.min(chart_duration.val, (v.target.value / 100) * chart_duration.val)
                                    );
                            },
                        }),
                        "%)"
                    ),
                    div(
                        { class: "row" },
                        song.difficulties.map((_, i) =>
                            button(
                                {
                                    onclick: () => {
                                        difficulty.val = i;
                                    },
                                    disabled: () => difficulty.val === i,
                                },
                                ["OP", "MD", "FN", "EN"][i]
                            )
                        )
                    ),
                    div(
                        "Level: ",
                        span({ class: () => `${difficulty_names[difficulty.val]}-text` }, () =>
                            song.difficulties[difficulty.val].toFixed(1)
                        )
                    ),
                    div(
                        "Score ",
                        button(
                            {
                                id: "score-rating-switch",
                                onclick: () => (score_rating_switch_selection.val = !score_rating_switch_selection.val),
                            },
                            () => (score_rating_switch_selection.val ? "->" : "<-")
                        ),
                        " Rating"
                    ),
                    div(
                        {
                            id: "score-rating",
                            class: "column",
                            style: () => (score_rating_switch_selection.val ? "" : "display: none"),
                        },
                        div(
                            { class: "row" },
                            input({
                                type: "number",
                                class: "right-aligned",
                                style: "width: 51px",
                                value: score_rating_score,
                                oninput: (v) => (score_rating_score.val = v.target.value),
                            }),
                            ["NA", "FC", "AC"].map((v, i) =>
                                button(
                                    {
                                        onclick: () => (score_rating_selection.val = i),
                                        disabled: () => score_rating_selection.val === i,
                                    },
                                    v
                                )
                            )
                        ),
                        div(
                            { class: "row" },
                            () =>
                                `${ratingFromScore(
                                    song.difficulties[difficulty.val],
                                    score_rating_score.val,
                                    score_rating_selection.val
                                ).toFixed(2)} rating`
                        )
                    ),
                    div(
                        {
                            id: "rating-score",
                            class: "column",
                            style: () => (score_rating_switch_selection.val ? "display: none" : ""),
                        },
                        div(
                            { class: "row" },
                            input({
                                type: "number",
                                class: "right-aligned",
                                style: "width: 37px",
                                value: rating_score_rating,
                                oninput: (v) => (rating_score_rating.val = v.target.value),
                            })
                        ),
                        ["NA", "FC", "AC"].map((v, i) =>
                            div(
                                {
                                    class: "row",
                                    style: () =>
                                        scoreFromRating(song.difficulties[difficulty.val], rating_score_rating.val, i) === undefined
                                            ? "display: none"
                                            : "",
                                },
                                () => `${v}: ${scoreFromRating(song.difficulties[difficulty.val], rating_score_rating.val, i)} score`
                            )
                        )
                    )
                ),
                div(
                    { class: "top-right column" },
                    div(
                        a(
                            { href: "https://discord.com/channels/828252123154219028/954952378132611114/1272585937183965214" },
                            "This tool was permitted by Cheryl."
                        )
                    )
                )
            );

            let last_column_split = column_split.val;
            let overwrite_scroll = false;
            let scroll = van.derive(() => {
                if (last_column_split != column_split.val) {
                    overwrite_scroll = true;
                    setTimeout(onScroll, 0);
                    last_column_split = column_split.val;
                }

                let scroll;
                if (column_split.val) {
                    let ppb = (pixels_per_second.val / song.bpm) * 60;
                    let split_height = Math.max(Math.floor(window_height.val / ppb), 1) * ppb;
                    let num_splits = Math.ceil(chart_height.val / split_height);

                    let width = (93 * scale.val + 50) * (num_splits - 1);
                    scroll = (current_time.val / chart_duration.val) * width;
                    if (column_split_reverse.val) chart_scroller.scrollLeft = scroll = width - scroll;
                    else chart_scroller.scrollLeft = scroll;
                } else {
                    if (upscroll.val) {
                        chart_scroller.scrollTop = scroll = current_time.val * pixels_per_second.val * scale.val;
                    } else {
                        chart_scroller.scrollTop = scroll =
                            (chart_height.val / scale.val - window_height.val / scale.val - current_time.val * pixels_per_second.val) *
                            scale.val;
                    }
                }

                return scroll;
            });

            function changeURL() {
                let url = new URL(window.location);
                url.search = "";
                url.searchParams.set("chart", chart);
                url.searchParams.set("diff", difficulty.val);
                url.searchParams.set("time", current_time.val.toFixed(2));
                window.history.replaceState(null, null, url);

                setTimeout(changeURL, 200);
            }

            changeURL();

            let in_scroll = false;
            function onScroll() {
                if (!in_scroll) {
                    in_scroll = true;

                    if (overwrite_scroll) {
                        chart_scroller.scrollTop = scroll.val;
                        chart_scroller.scrollLeft = scroll.val;
                        overwrite_scroll = false;
                    } else {
                        if (column_split.val) {
                            let ppb = (pixels_per_second.val / song.bpm) * 60;
                            let split_height = Math.max(Math.floor(window_height.val / ppb), 1) * ppb;
                            let num_splits = Math.ceil(chart_height.val / split_height);

                            let width = (93 * scale.val + 50) * (num_splits - 1);
                            if (column_split_reverse.val) current_time.val = (1 - chart_scroller.scrollLeft / width) * chart_duration.val;
                            else current_time.val = (chart_scroller.scrollLeft / width) * chart_duration.val;
                        } else {
                            if (upscroll.val) {
                                current_time.val = chart_scroller.scrollTop / scale.val / pixels_per_second.val;
                            } else {
                                current_time.val =
                                    (chart_height.val / scale.val - chart_scroller.scrollTop / scale.val - window_height.val / scale.val) /
                                    pixels_per_second.val;
                            }
                        }
                    }

                    in_scroll = false;
                }
            }
            addEventListener("scroll", onScroll);
            addEventListener("resize", () => {
                window_height.val = chart_scroller.clientHeight;
            });

            return;
        }

        window.location.href = "/vs-charts";
    });
});
