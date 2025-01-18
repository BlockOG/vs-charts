let { a, div, img, input, link, title } = van.tags;

let url = new URL(window.location);
if (!url.searchParams.has("chart") || !url.searchParams.has("diff")) window.location.href = "/vs-charts/others";

const chart = url.searchParams.get("chart");
const difficulty = van.state(url.searchParams.get("diff"));
fetch("/vs-charts/other_song_data.json").then((data) => {
    data.json().then((data) => {
        for (let song of data) {
            if (song.file_name !== chart || song.difficulty !== difficulty.val) continue;

            const scroll_speed = van.state(10.0);
            const pixels_per_second = van.derive(() => 100 + 20 * scroll_speed.val);

            const chart_scroller = document.getElementById("chart-scroller");
            const window_height = van.state(chart_scroller.clientHeight);

            const scale = van.savedState("scale", 1);

            const chart_duration = van.derive(() => song.duration);
            const chart_height = van.derive(() => Math.floor(chart_duration.val * pixels_per_second.val * scale.val));
            const current_time = van.state(parseFloat(url.searchParams.get("time")) || 0);
            const current_percentage = van.derive(() => (current_time.val / chart_duration.val) * 100);

            van.add(
                document.head,
                title(() => `${song.name} ${difficulty.val}`),
                link({ rel: "icon", type: "image/png", href: `/vs-charts/jackets/${chart}.png` })
            );
            van.add(
                document.body,
                div(
                    { class: "top-left column" },
                    div(a({ href: "/vs-charts/others" }, "Boundary Shatter charts")),
                    div(`Name: ${song.name}`),
                    div(`BPM: ${song.bpm}`),
                    div("Scroll speed: ", input({ type: "number", class: "right-aligned", value: scroll_speed, size: 3, disabled: true })),
                    div(
                        "Scale: ",
                        nonInterferingInput({
                            type: "number",
                            class: "right-aligned",
                            value: scale,
                            oninput: (v) => {
                                if (v.target.value > 0) scale.val = v.target.value;
                            },
                            size: 3,
                        })
                    ),
                    div(
                        "Time: ",
                        nonInterferingInput({
                            type: "number",
                            class: "right-aligned",
                            value: () => current_time.val.toFixed(2),
                            oninput: (v) => {
                                if (v.target.value !== "") current_time.val = Math.max(0, Math.min(chart_duration.val, v.target.value));
                            },
                            size: 5,
                        }),
                        () => `/${chart_duration.val.toFixed(2)} (`,
                        nonInterferingInput({
                            type: "number",
                            class: "right-aligned",
                            value: () => current_percentage.val.toFixed(2),
                            oninput: (v) => {
                                if (v.target.value !== "")
                                    current_time.val = Math.max(
                                        0,
                                        Math.min(chart_duration.val, (v.target.value / 100) * chart_duration.val)
                                    );
                            },
                            size: 5,
                        }),
                        "%)"
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
                ),
                () =>
                    div(
                        {
                            class: "chart-image",
                            style: () =>
                                `width: ${91 * scale.val}px; height: ${chart_height.val}px; border-left-width: ${
                                    scale.val
                                }px; border-right-width: ${scale.val}px`,
                        },
                        Array.from({ length: Math.ceil(chart_height.val / 65535) }, (_, i) =>
                            img({ src: `/vs-charts/charts/${song.file_name}/${difficulty.val}-${i}.png` })
                        )
                    )
            );

            van.derive(() => {
                chart_scroller.scrollTop =
                    (chart_height.val / scale.val - window_height.val / scale.val - current_time.val * pixels_per_second.val) * scale.val;
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
            addEventListener("scroll", () => {
                if (!in_scroll) {
                    in_scroll = true;
                    current_time.val =
                        (chart_height.val / scale.val - chart_scroller.scrollTop / scale.val - window_height.val / scale.val) /
                        pixels_per_second.val;
                    in_scroll = false;
                }
            });
            addEventListener("resize", () => {
                window_height.val = chart_scroller.clientHeight;
            });

            return;
        }

        window.location.href = "/vs-charts/others";
    });
});
