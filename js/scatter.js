// Scatter plot: screen size vs energy consumption, coloured by screen technology.
(async function () {
  const data = await d3.csv("data/Ex5_TV_energy.csv", d => ({
    brand: d.brand,
    tech: d.screen_tech,
    size: +d.screensize,
    energy: +d.energy_consumpt,
    stars: +d.star2,
    count: +d.count
  }));

  const techs = [
    { id: "LCD", name: "LCD", color: "var(--s1)" },
    { id: "LCD (LED)", name: "LED (LCD)", color: "var(--s2)" },
    { id: "OLED", name: "OLED", color: "var(--s3)" }
  ];
  const techById = new Map(techs.map(t => [t.id, t]));
  const visible = new Set(techs.map(t => t.id));

  // Draw large groups first so small circles stay on top
  data.sort((a, b) => b.count - a.count);

  const container = d3.select("#scatter-chart");
  let width = 0;

  Viz.legend("#scatter-legend", techs, visible, () => width && render(width));

  function render(w) {
    width = w;
    container.selectAll("svg").remove();

    const height = Viz.heightFor(width, 0.5, 300, 480);
    const margin = { top: 12, right: 16, bottom: 44, left: 62 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.size) + 5]).nice().range([0, innerW]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.energy)]).nice().range([innerH, 0]);
    // Circle area proportional to number of models; scaled down on small screens
    const maxR = width < 500 ? 9 : 14;
    const r = d3.scaleSqrt().domain([0, d3.max(data, d => d.count)]).range([0, maxR]);
    const radius = d => Math.max(3, r(d.count));

    const shown = data.filter(d => visible.has(d.tech));

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", "Scatter plot of TV screen size against energy consumption");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g").call(Viz.gridY, y, innerW);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.max(4, Math.floor(innerW / 80))));

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));

    g.append("text")
      .attr("class", "axis-label")
      .attr("x", innerW / 2)
      .attr("y", innerH + 38)
      .attr("text-anchor", "middle")
      .text("Screen size (inches)");

    g.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text("Energy consumption (kWh / year)");

    g.append("g")
      .selectAll("circle")
      .data(shown)
      .join("circle")
      .attr("cx", d => x(d.size))
      .attr("cy", d => y(d.energy))
      .attr("r", radius)
      .attr("fill", d => techById.get(d.tech).color)
      .attr("fill-opacity", 0.65)
      .attr("stroke", "var(--surface)")
      .attr("stroke-width", 1);

    // Highlight ring for the hovered point
    const focus = g.append("circle")
      .attr("fill", "none")
      .attr("stroke", "var(--text-primary)")
      .attr("stroke-width", 2)
      .style("display", "none");

    // Nearest-point hover: much easier to hit than individual small circles
    const delaunay = d3.Delaunay.from(shown, d => x(d.size), d => y(d.energy));

    g.append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .on("pointermove", event => {
        const [mx, my] = d3.pointer(event);
        const i = delaunay.find(mx, my);
        const d = shown[i];
        if (!d || Math.hypot(x(d.size) - mx, y(d.energy) - my) > 40) {
          focus.style("display", "none");
          Viz.hideTooltip();
          return;
        }
        focus.style("display", null)
          .attr("cx", x(d.size))
          .attr("cy", y(d.energy))
          .attr("r", radius(d) + 2);
        const t = techById.get(d.tech);
        Viz.showTooltip(
          `<div class="tt-title">${d.brand.replace(/\b\w/g, c => c.toUpperCase())}</div>
           <div class="tt-row"><span class="swatch" style="background:${t.color}"></span>${t.name}, ${d.size}"</div>
           <div class="tt-row"><span class="tt-muted">Energy</span><span class="tt-val">${d3.format(",.1f")(d.energy)} kWh</span></div>
           <div class="tt-row"><span class="tt-muted">Star rating</span><span class="tt-val">${d.stars}</span></div>
           <div class="tt-row"><span class="tt-muted">Models</span><span class="tt-val">${d.count}</span></div>`,
          event
        );
      })
      .on("pointerleave", () => {
        focus.style("display", "none");
        Viz.hideTooltip();
      });
  }

  Viz.responsive("#scatter-chart", render);
})();
