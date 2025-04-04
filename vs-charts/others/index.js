const { a, button, div, img, input, span } = van.tags;

fetch("/vs-charts/other_song_data.json").then((data) => {
    data.json().then((song_data) => {
        van.add(
            document.body,
            div(
                { class: "text-column" },
                div(
                    { class: "row" },
                    a(
                        {
                            style: "margin-left: auto",
                            href: "https://discord.com/channels/828252123154219028/954952378132611114/1272585937183965214",
                        },
                        "This tool was permitted by Cheryl."
                    )
                ),
                div({ class: "row" }, a({ style: "margin-left: auto", href: "https://github.com/BlockOG/vs-charts/issues" }, "Any feedback is appreciated")),
                div({ class: "row" }, a({ style: "margin-left: auto", href: "/vs-charts" }, "All charts"))
            ),
            () => {
                const diff_to_charts = {};
                for (const song of song_data) {
                    diff_to_charts[song.difficulty] = diff_to_charts[song.difficulty] || [];
                    diff_to_charts[song.difficulty].push(song);
                }

                const level_column = [];
                const jacket_column = [];
                for (const i in diff_to_charts) {
                    const i_fall = difficulty_names.includes(i) ? i : "fallback";
                    const i_titled = i[0].toUpperCase() + i.slice(1);

                    level_column.push(div(span({ class: `${i_fall}-text` }, i_titled)));

                    jacket_column.push(
                        div(
                            { class: "jacket-row" },
                            diff_to_charts[i].map((chart) =>
                                a(
                                    { class: `${i_fall}-link`, href: `/vs-charts/others/chart?chart=${chart.file_name}&diff=${i}` },
                                    img({ style: `width: 100px`, src: `/vs-charts/jackets/${chart.file_name}.png`, style: "width: 100px", title: `${chart.name} ${i}` })
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
            window.history.replaceState(null, null, url);
        });
    });
});
