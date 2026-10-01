// Shared helpers used by every chart: tooltip, responsive redraw and legend toggles.
const Viz = (() => {
  const tooltip = d3.select("body").append("div").attr("class", "tooltip").attr("role", "status");

  function showTooltip(html, event) {
    tooltip.html(html).style("opacity", 1);
    const node = tooltip.node();
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    let x = event.clientX + 14;
    let y = event.clientY + 14;
    // Keep the tooltip inside the window
    if (x + w > window.innerWidth - 8) x = event.clientX - w - 14;
    if (y + h > window.innerHeight - 8) y = event.clientY - h - 14;
    tooltip.style("left", `${Math.max(8, x)}px`).style("top", `${Math.max(8, y)}px`);
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  // Calls render(width) whenever the container changes width.
  function responsive(selector, render) {
    const el = document.querySelector(selector);
    let lastWidth = 0;
    let frame;
    new ResizeObserver(entries => {
      const width = Math.floor(entries[0].contentRect.width);
      if (width === 0 || width === lastWidth) return;
      lastWidth = width;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => render(width));
    }).observe(el);
    return () => lastWidth;
  }

  // Chart height follows width, clamped so charts stay readable on phones and big monitors.
  function heightFor(width, ratio = 0.55, min = 260, max = 460) {
    return Math.max(min, Math.min(max, Math.round(width * ratio)));
  }

  // Builds toggleable legend buttons. items: [{ id, name, color, style }]
  function legend(selector, items, visible, onChange) {
    const buttons = d3.select(selector)
      .selectAll("button")
      .data(items)
      .join("button")
      .attr("type", "button")
      .attr("aria-pressed", d => visible.has(d.id));
    buttons.append("span")
      .attr("class", d => `swatch ${d.style || ""}`)
      .style("background", d => d.color);
    buttons.append("span").text(d => d.name);
    buttons.on("click", (event, d) => {
      if (visible.has(d.id)) {
        if (visible.size === 1) return; // always keep at least one series
        visible.delete(d.id);
      } else {
        visible.add(d.id);
      }
      buttons.attr("aria-pressed", b => visible.has(b.id));
      onChange();
    });
  }

  function gridY(g, y, width) {
    g.attr("class", "grid-lines")
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(""));
  }

  return { showTooltip, hideTooltip, responsive, heightFor, legend, gridY };
})();
