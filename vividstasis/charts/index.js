const { a, button, div, img, input, span } = van.tags;

fetch("/vividstasis/charts/song_data.json").then((data) => {
    data.json().then((song_data) => {
        const url = new URL(window.location);

        const level_range_start = van.state(-Infinity);
        const level_range_end = van.state(Infinity);
        if (url.searchParams.has("level-range")) {
            const level_range = url.searchParams.get("level-range").split("-");
            if (level_range.length >= 2) {
                level_range_start.val = parseFloat(level_range[0]) || -Infinity;
                level_range_end.val = parseFloat(level_range[1]) || Infinity;
            }
        }

        const level_range = van.derive(
            () =>
                (level_range_start.val === -Infinity ? "" : level_range_start.val.toFixed(1)) +
                "-" +
                (level_range_end.val === Infinity ? "" : level_range_end.val.toFixed(1))
        );

        const level_search = van.state(url.searchParams.get("level-search") ?? "");

        const difficulties = Array.from({ length: 4 }, () => van.state(true));
        if (url.searchParams.has("disabled")) {
            const disabled = url.searchParams.get("disabled");
            if (disabled.length >= 4) {
                for (let i = 0; i < 4; i++) {
                    difficulties[i].val = disabled[i] === "0";
                }
            }
        }

        const disabled = van.derive(() => difficulties.map((i) => 1 - i.val).join(""));

        van.add(
            document.body,
            div(
                { class: "text-column" },
                div(
                    { class: "row" },
                    "Level range: ",
                    nonInterferingInput({
                        type: "number",
                        class: "right-aligned",
                        style: "width: 26px",
                        value: level_range_start,
                        oninput: (v) => (level_range_start.val = parseFloat(v.target.value) || -Infinity),
                    }),
                    " to ",
                    nonInterferingInput({
                        type: "number",
                        class: "right-aligned",
                        style: "width: 26px",
                        value: level_range_end,
                        oninput: (v) => (level_range_end.val = parseFloat(v.target.value) || Infinity),
                    }),
                    input({
                        type: "search",
                        style: "margin-left: auto",
                        value: level_search,
                        oninput: (v) => (level_search.val = v.target.value),
                        placeholder: "Search",
                    }),
                    a(
                        {
                            style: "margin-left: auto",
                            href: "https://discord.com/channels/828252123154219028/954952378132611114/1272585937183965214",
                        },
                        "This tool was permitted by Cheryl."
                    )
                ),
                div(
                    { class: "row" },
                    ...["OP:", "MD:", "FN:", "EN:"].map((v, i) => [
                        v,
                        input({
                            type: "checkbox",
                            checked: difficulties[i],
                            oninput: (v) => (difficulties[i].val = v.target.checked),
                        }),
                    ]),
                    a({ style: "margin-left: auto", href: "https://github.com/BlockOG/vs-charts/issues" }, "Any feedback is appreciated")
                ),
                div(
                    { class: "row" },
                    button({ onclick: () => navigator.clipboard.writeText(window.location.href) }, "Copy link"),
                    a({ style: "margin-left: auto; color: #000 !important", href: "/vividstasis/charts/others" }, "ooo scawwy")
                )
            ),
            () => {
                const levels = {};
                for (const [i, song] of song_data.entries()) {
                    if (
                        !song.name.toLowerCase().includes(level_search.val.toLowerCase()) &&
                        !(song.backstage && song.backstage.name.toLowerCase().includes(level_search.val.toLowerCase())) &&
                        !song.file_name.includes(level_search.val.toLowerCase())
                    )
                        continue;

                    const song_difficulties = song.difficulties;
                    for (const [j, level] of song_difficulties.entries()) {
                        if (!difficulties[j].val) continue;
                        if (level_range_start.val > level || level > level_range_end.val) continue;

                        const level_string = level.toFixed(1);
                        if (!levels[level_string]) levels[level_string] = [];
                        levels[level_string].push([
                            song.file_name,
                            j + (j === 3 && song.backstage !== undefined),
                            i,
                            (j === 3 && song.backstage && song.backstage.name) || song.name,
                        ]);
                    }
                }

                const sorted_levels = [];
                for (const [level, level_charts] of Object.entries(levels)) {
                    level_charts.sort((a, b) => (a[1] === b[1] ? a[2] - b[2] : a[1] - b[1]));
                    sorted_levels.push([level, parseFloat(level)]);
                }

                sorted_levels.sort((a, b) => a[1] - b[1]);

                const level_column = [];
                const jacket_column = [];
                for (const i in sorted_levels) {
                    const level = sorted_levels[i][0];

                    level_column.push(
                        div(
                            span(
                                {
                                    class: `${difficulty_names[levels[level][0][1]]}-text`,
                                    style: level[level.length - 1] === "1" ? "padding-right: 15px" : "",
                                },
                                level
                            )
                        )
                    );

                    jacket_column.push(
                        div(
                            { class: "jacket-row" },
                            levels[level].map((chart) =>
                                a(
                                    {
                                        class: `${difficulty_names[chart[1]]}-link`,
                                        href: `/vividstasis/charts/chart?chart=${chart[0]}&diff=${Math.min(chart[1], 3)}`,
                                    },
                                    img({
                                        src: `/vividstasis/charts/jackets/${chart[0]}${chart[1] === 4 ? "_backstage" : ""}.png`,
                                        style: "width: 100px",
                                        title: `${chart[3]} ${difficulty_names[chart[1]]} ${level}`,
                                    })
                                )
                            )
                        )
                    );
                }

                return div({ class: "jackets-display" }, div({ class: "column level-column" }, level_column), div({ class: "column" }, jacket_column));
            }
        );

        van.derive(() => {
            const url = new URL(window.location);
            url.search = "";
            if (level_range.val !== "-") url.searchParams.set("level-range", level_range.val);
            if (level_search.val !== "") url.searchParams.set("level-search", level_search.val);
            if (disabled.val !== "0000") url.searchParams.set("disabled", disabled.val);
            window.history.replaceState(null, null, url);
        });
    });
});
