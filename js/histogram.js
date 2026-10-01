// Histogram: distribution of labelled TV energy consumption (kWh/year).
(async function () {
  const data = await d3.csv("data/Ex5_TV_energy.csv", d => ({
    energy: +d.energy_consumpt,
    count: +d.count
  }));

  const binWidth = 50;
  const maxEnergy = Math.ceil(d3.max(data, d => d.energy) / binWidth) * binWidth;
  const thresholds = d3.range(0, maxEnergy + binWidth, binWidth);

  // Rows are pre-aggregated, so weight each row by its model count
  const bins = d3.bin()
    .value(d => d.energy)
    .domain([0, maxEnergy])
    .thresholds(thresholds)(data)
    .map(bin => ({ x0: bin.x0, x1: bin.x1, models: d3.sum(bin, d => d.count) }));

  const container = d3.select("#histogram");

  function render(width) {
    container.selectAll("svg").remove();

    const height = Viz.heightFor(width, 0.62, 260, 380);
    const margin = { top: 12, right: 12, bottom: 44, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([0, maxEnergy]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.models)]).nice().range([innerH, 0]);

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", "Histogram of TV energy consumption in kilowatt hours per year");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g").call(Viz.gridY, y, innerW);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.max(3, Math.floor(innerW / 70))));

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));

    g.append("text")
      .attr("class", "axis-label")
      .attr("x", innerW / 2)
      .attr("y", innerH + 38)
      .attr("text-anchor", "middle")
      .text("Energy consumption (kWh / year)");

    g.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -38)
      .attr("text-anchor", "middle")
      .text("Number of models");

    const gap = 2;
    const radius = Math.min(4, (x(binWidth) - gap) / 2);

    const bars = g.append("g")
      .selectAll("g")
      .data(bins)
      .join("g")
      .on("pointerenter pointermove", (event, d) => {
        d3.select(event.currentTarget).select(".bar").attr("fill-opacity", 1);
        Viz.showTooltip(
          `<div class="tt-title">${d.x0}&ndash;${d.x1} kWh / year</div>
           <div class="tt-row"><span class="tt-muted">Models</span><span class="tt-val">${d.models}</span></div>`,
          event
        );
      })
      .on("pointerleave", event => {
        d3.select(event.currentTarget).select(".bar").attr("fill-opacity", 0.9);
        Viz.hideTooltip();
      });

    // Invisible full-height hit area so thin bars are easy to hover
    bars.append("rect")
      .attr("x", d => x(d.x0))
      .attr("width", d => x(d.x1) - x(d.x0))
      .attr("y", 0)
      .attr("height", innerH)
      .attr("fill", "transparent");

    // Bars with rounded tops, square base on the axis
    bars.append("path")
      .attr("class", "bar")
      .attr("fill", "var(--s1)")
      .attr("fill-opacity", 0.9)
      .attr("d", d => {
        if (d.models === 0) return null;
        const x0 = x(d.x0) + gap / 2;
        const w = x(d.x1) - x(d.x0) - gap;
        const top = y(d.models);
        const r = Math.min(radius, (innerH - top));
        return `M${x0},${innerH}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + w - r}Q${x0 + w},${top} ${x0 + w},${top + r}V${innerH}Z`;
      });
  }

  Viz.responsive("#histogram", render);
})();
