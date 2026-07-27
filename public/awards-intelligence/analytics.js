window.AwardsAnalytics = (() => {
  const queue = window.awardsIntelligenceEvents || [];
  window.awardsIntelligenceEvents = queue;

  function track(eventName, payload = {}) {
    const event = {
      event: eventName,
      payload,
      timestamp: new Date().toISOString(),
    };
    queue.push(event);
    window.dispatchEvent(new CustomEvent("awards-intelligence:analytics", { detail: event }));
    return event;
  }

  document.addEventListener("click", (event) => {
    const predictionsLink = event.target.closest?.("[data-predictions-link]");
    if (predictionsLink) track("prediction_page_opened", { surface: "global_nav" });
    const portfolioLink = event.target.closest?.("[data-portfolio-return]");
    if (portfolioLink) track("portfolio_return_clicked", { surface: "global_nav" });
  });

  return { track };
})();
