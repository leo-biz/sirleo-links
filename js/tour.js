(function () {
  // Only show once — skip if already seen or form already submitted
  if (localStorage.getItem('sl_tour_done') || localStorage.getItem('sl_submitted')) return;

  // Wait for Driver.js to load
  if (typeof window.driver === 'undefined') return;

  // Slight delay so the page settles
  setTimeout(startTour, 2200);

  function startTour() {
    const driverObj = window.driver.js.driver({
      animate: true,
      smoothScroll: true,
      showProgress: false,
      allowClose: true,
      overlayOpacity: 0.72,
      stagePadding: 10,
      stageRadius: 0,
      popoverClass: 'sl-tour-popover',
      onDestroyed: () => localStorage.setItem('sl_tour_done', '1'),
      steps: [
        {
          element: '.hero-text',
          popover: {
            title: 'Welcome.',
            description: 'You\'ve entered the world of Sir Leo — Chicago\'s archetype of refined dominance. Let me show you around.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#card-book',
          popover: {
            title: 'Book an Experience',
            description: 'Private sessions, group experiences, performances, and education. A guided intake walks you through choosing the right fit.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#card-reach',
          popover: {
            title: 'Reach Out Directly',
            description: 'Text or email Sir Leo. Every message is read personally. He responds within 48 hours.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#card-follow',
          popover: {
            title: 'Stay in the World',
            description: 'Follow on Instagram, Facebook, or FetLife to stay connected with Sir Leo\'s world.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '.faq-section',
          popover: {
            title: 'Common Questions',
            description: 'New here? This section answers the questions most people carry in but hesitate to ask.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#sl-chat-btn',
          popover: {
            title: 'The Guide',
            description: 'Questions the FAQ doesn\'t answer? The Guide is here — an AI presence within Sir Leo\'s world, ready to help.',
            side: 'left',
            align: 'end',
          },
        },
      ],
    });

    driverObj.drive();
  }
})();
