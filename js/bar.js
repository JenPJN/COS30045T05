// Bar chart: mean energy consumption by screen technology, all sizes vs 55-inch TVs.
(async function () {
  const [allSizes, inch55] = await Promise.all([
    d3.csv("data/Ex5_TV_energy_Allsizes_byScreenType.csv"),
    d3.csv("data/Ex5_TV_energy_55inchtv_byScreenType.csv")
  ]);

  // Same colours as the scatter plot so each technology keeps its identity across charts
  const techs = [
    { id: "LCD", name: "LCD", color: "var(--s1)" },
    { id: "LED", name: "LED (LCD)", color: "var(--s2)" },
    { id: "OLED", name: "OLED", color: "var(--s3)" }
  ];
  const valueKey = "Mean(Labelled energy consumption (kWh/year))";
  const toMap = rows => new Map(rows.map(d => [d.Screen_Tech, +d[valueKey]]));

  const datasets = {
    all: { label: "All screen sizes", values: toMap(allSizes) },
    inch55: { label: "55-inch TVs", values: toMap(inch55) }
  };
  let mode = "all";

  // Shared y-scale domain so switching views shows a genuine change in height
  const yMax = d3.max(Object.values(datasets), ds => d3.max(ds.values.values()));

  const controls = d3.select("#bar-controls")
    .selectAll("button")
    .data(Object.entries(datasets))
    .join("button")
    .attr("type", "button")
    .attr("class", "segmented")
    .attr("aria-pressed", ([key]) => key === mode)
    .text(([, ds]) => ds.label)
    .on("click", (event, [key]) => {
      mode = key;
      controls.attr("aria-pressed", ([k]) => k === mode);
      update(true);
    });

  const container = d3.select("#bar-chart");
  let update = () => {};

  function render(width) {
    container.selectAll("svg").remove();

    const height = Viz.heightFor(width, 0.62, 260, 340);
    const margin = { top: 24, right: 12, bottom: 44, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const x = d3.scaleBand().domain(techs.map(t => t.id)).range([0, innerW]).padding(0.35);
    const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerH, 0]);

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", "Bar chart of mean TV energy consumption by screen technology");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g").call(Viz.gridY, y, innerW);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(id => techs.find(t => t.id === id).name).tickSizeOuter(0));

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));

    g.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -38)
      .attr("text-anchor", "middle")
      .text("Mean kWh / year");

    const barPath = (xPos, w, value) => {
      const top = y(value);
      const r = Math.min(4, w / 2, innerH - top);
      return `M${xPos},${innerH}V${top + r}Q${xPos},${top} ${xPos + r},${top}H${xPos + w - r}Q${xPos + w},${top} ${xPos + w},${top + r}V${innerH}Z`;
    };

    const groups = g.append("g")
      .selectAll("g")
      .data(techs)
      .join("g")
      .on("pointerenter pointermove", (event, t) => {
        const v = datasets[mode].values.get(t.id);
        Viz.showTooltip(
          `<div class="tt-title">${t.name}</div>
           <div class="tt-row"><span class="tt-muted">${datasets[mode].label}</span>
           <span class="tt-val">${d3.format(",.0f")(v)} kWh</span></div>`,
          event
        );
      })
      .on("pointerleave", Viz.hideTooltip);

    groups.append("rect")
      .attr("x", t => x(t.id))
      .attr("width", x.bandwidth())
      .attr("height", innerH)
      .attr("fill", "transparent");

    const bars = groups.append("path").attr("fill", t => t.color);
    const labels = groups.append("text")
      .attr("class", "value-label")
      .attr("text-anchor", "middle")
      .attr("x", t => x(t.id) + x.bandwidth() / 2);

    update = animate => {
      const values = datasets[mode].values;
      const tBars = animate ? bars.transition().duration(500) : bars;
      const tLabels = animate ? labels.transition().duration(500) : labels;
      tBars.attr("d", t => barPath(x(t.id), x.bandwidth(), values.get(t.id)));
      tLabels
        .attr("y", t => y(values.get(t.id)) - 8)
        .text(t => d3.format(",.0f")(values.get(t.id)));
    };
    update(false);
  }

  Viz.responsive("#bar-chart", render);
})();
