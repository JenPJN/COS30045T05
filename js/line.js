// Line chart: annual average electricity spot prices by NEM region, 1998-2024.
(async function () {
  const raw = await d3.csv("data/Ex5_ARE_Spot_Prices.csv");

  const regions = [
    { id: "Queensland ($ per megawatt hour)", name: "Queensland", color: "var(--s1)" },
    { id: "New South Wales ($ per megawatt hour)", name: "New South Wales", color: "var(--s2)" },
    { id: "Victoria ($ per megawatt hour)", name: "Victoria", color: "var(--s3)" },
    { id: "South Australia ($ per megawatt hour)", name: "South Australia", color: "var(--s4)" },
    { id: "Tasmania ($ per megawatt hour)", name: "Tasmania", color: "var(--s5)" },
    { id: "Snowy ($ per megawatt hour)", name: "Snowy", color: "var(--s6)" },
    { id: "Average Price (notTas-Snowy)", name: "Mainland average", color: "var(--text-primary)", style: "dashed", average: true }
  ];

  const years = raw.map(d => +d.Year);
  const series = regions.map(s => ({
    ...s,
    values: raw.map(d => ({ year: +d.Year, value: d[s.id] === "" ? null : +d[s.id] }))
  }));

  const visible = new Set(regions.map(r => r.id));
  const container = d3.select("#line-chart");
  let width = 0;

  Viz.legend("#line-legend", regions, visible, () => width && render(width));

  function render(w) {
    width = w;
    container.selectAll("svg").remove();

    const shown = series.filter(s => visible.has(s.id));
    const height = Viz.heightFor(width, 0.45, 300, 460);
    const margin = { top: 16, right: width < 600 ? 16 : 110, bottom: 36, left: 52 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(shown, s => d3.max(s.values, v => v.value))])
      .nice()
      .range([innerH, 0]);

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", "Line chart of annual electricity spot prices by region from 1998 to 2024");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g").call(Viz.gridY, y, innerW);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.max(4, Math.floor(innerW / 70))).tickFormat(d3.format("d")));

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6).tickFormat(d => `$${d}`));

    g.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .text("$ per megawatt hour");

    const line = d3.line()
      .defined(v => v.value !== null)
      .x(v => x(v.year))
      .y(v => y(v.value))
      .curve(d3.curveMonotoneX);

    g.append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(shown)
      .join("path")
      .attr("stroke", s => s.color)
      .attr("stroke-width", s => (s.average ? 2.5 : 2))
      .attr("stroke-dasharray", s => (s.average ? "6 4" : null))
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", s => line(s.values));

    // Direct label for the average line only, when there is room at the right
    const avg = shown.find(s => s.average);
    if (avg && margin.right > 16) {
      const last = avg.values[avg.values.length - 1];
      g.append("text")
        .attr("class", "direct-label")
        .attr("x", innerW + 8)
        .attr("y", y(last.value))
        .attr("dy", "0.35em")
        .text("Mainland avg");
    }

    // Crosshair + tooltip listing every visible region for the hovered year
    const hover = g.append("g").style("display", "none");
    hover.append("line")
      .attr("y1", 0)
      .attr("y2", innerH)
      .attr("stroke", "var(--text-muted)")
      .attr("stroke-dasharray", "3 3");
    const dots = hover.selectAll("circle")
      .data(shown)
      .join("circle")
      .attr("r", 4.5)
      .attr("fill", s => s.color)
      .attr("stroke", "var(--surface)")
      .attr("stroke-width", 2);

    g.append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .on("pointermove", event => {
        const [mx] = d3.pointer(event);
        const year = Math.round(x.invert(mx));
        const idx = years.indexOf(year);
        if (idx < 0) return;

        hover.style("display", null);
        hover.select("line").attr("x1", x(year)).attr("x2", x(year));
        dots
          .style("display", s => (s.values[idx].value === null ? "none" : null))
          .attr("cx", x(year))
          .attr("cy", s => (s.values[idx].value === null ? 0 : y(s.values[idx].value)));

        const rows = shown
          .filter(s => s.values[idx].value !== null)
          .sort((a, b) => b.values[idx].value - a.values[idx].value)
          .map(s => `<div class="tt-row"><span class="swatch ${s.average ? "dashed" : "line"}" style="background:${s.color}"></span>
            ${s.name}<span class="tt-val">$${s.values[idx].value}</span></div>`)
          .join("");
        Viz.showTooltip(`<div class="tt-title">${year}</div>${rows}`, event);
      })
      .on("pointerleave", () => {
        hover.style("display", "none");
        Viz.hideTooltip();
      });
  }

  Viz.responsive("#line-chart", render);
})();
