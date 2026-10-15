/*
 * Gindi Innovations — site content
 * ------------------------------------------------------------
 * Edit this file to change services, projects and contact details.
 * Colours and fonts live at the top of assets/css/styles.css.
 *
 * Contact values still wrapped in [SQUARE BRACKETS] (or left empty)
 * are treated as "not configured" and hidden from the page.
 */
window.GINDI_CONFIG = {
  brand: {
    name: 'Gindi Innovations',
    // Path to a logo image, e.g. 'assets/img/logo.svg'.
    // Leave empty to use the text wordmark.
    logo: '',
  },

  contact: {
    // Digits with country code, e.g. '971501234567' or '+971 50 123 4567'.
    whatsapp: '[WHATSAPP NUMBER WITH COUNTRY CODE]',
    phone: '[PHONE NUMBER]',
    email: '[EMAIL ADDRESS]',
    // Full URL, e.g. 'https://www.instagram.com/yourhandle'.
    instagram: '[INSTAGRAM LINK]',
    location: '[LOCATION]',
  },

  enquiryForm: {
    // Where enquiries are sent. Any endpoint that accepts a POST of form
    // data and returns a 2xx status works (Formspree, Basin, Getform, or
    // your own server). Example: 'https://formspree.io/f/abcdwxyz'.
    // While empty, the form validates but will not claim to have sent anything.
    endpoint: '',
  },

  // Sample categories — replace with the final service list.
  // icon: one of design, fitout, visualization, lighting, furniture, consultation.
  services: [
    {
      id: 'interior-design',
      icon: 'design',
      name: 'Interior Design',
      summary: 'Space planning, design concepts, materials, and finishes.',
      details:
        'We start with how you use your space, then shape a complete design around it: layout, mood, materials, and finishes that work together.',
      deliverables: [
        'Space planning and furniture layouts',
        'Design concept with mood and material boards',
        'Schedule of selected materials and finishes',
      ],
    },
    {
      id: 'finishing-fit-out',
      icon: 'fitout',
      name: 'Finishing & Fit-Out',
      summary: 'Bringing the approved design to life through coordinated execution.',
      details:
        'We turn the approved design into a finished space, coordinating trades, materials, and site work so the result matches the plan.',
      deliverables: [
        'Coordinated site execution',
        'Material sourcing and quality checks',
        'Final walkthrough and handover',
      ],
    },
    {
      id: '3d-visualization',
      icon: 'visualization',
      name: '3D Visualization',
      summary: 'Explore the look and feel of your space before implementation.',
      details:
        'Realistic 3D views let you see proportions, materials, and light before any work begins, so you can make decisions with confidence.',
      deliverables: [
        'Photorealistic renders of key views',
        'Material and finish options side by side',
        'Revisions based on your feedback',
      ],
    },
    {
      id: 'lighting-design',
      icon: 'lighting',
      name: 'Lighting Design',
      summary: 'Lighting layouts that balance atmosphere, comfort, and function.',
      details:
        'Layered lighting shapes how a room feels from morning to night. We plan fixtures and controls around each space and how it is used.',
      deliverables: [
        'Lighting layout and fixture plan',
        'Fixture selection to suit the design',
        'Lighting scenes and control recommendations',
      ],
    },
    {
      id: 'furniture-styling',
      icon: 'furniture',
      name: 'Furniture & Styling',
      summary: 'Furniture selection, custom pieces, and finishing touches.',
      details:
        'We select and design pieces that suit your space and routine, then add the details that make it feel complete and personal.',
      deliverables: [
        'Curated furniture selection',
        'Custom pieces designed where needed',
        'Accessories, artwork, and final styling',
      ],
    },
    {
      id: 'design-consultation',
      icon: 'consultation',
      name: 'Design Consultation',
      summary: 'Focused guidance for your space, ideas, and design decisions.',
      details:
        'A focused session for when you need clear direction, whether you are starting out, refreshing one room, or weighing up a decision.',
      deliverables: [
        'On-site or online consultation',
        'Practical recommendations for your space',
        'A concise summary of next steps',
      ],
    },
  ],

  // Online tools, shown as full-width cards under the service tiles.
  // Each opens its own page; they are not listed in the enquiry form.
  tools: [
    {
      icon: 'wire',
      label: 'Online tool · in Arabic',
      name: 'Wire Calculator',
      summary:
        'Estimate how many rolls of electrical wire an apartment fit-out needs, and compare it with your electrician’s quote.',
      linkText: 'Open calculator',
      url: 'tools/wire-calculator.html',
      lang: 'ar',
    },
    {
      icon: 'brick',
      label: 'Online tool · in Arabic',
      name: 'Brick Calculator',
      summary:
        'Work out how many bricks your walls need and what they will cost, for the brick type and size you choose.',
      linkText: 'Open calculator',
      url: 'tools/brick-calculator.html',
      lang: 'ar',
    },
  ],

  // Project images. Set placeholder: false once these are real company work.
  // Each image needs three widths: <base>-600.webp, <base>-1000.webp, <base>-1800.webp.
  projects: [
    {
      title: 'Open Living Space',
      image: 'assets/img/project-1',
      alt: 'Bright open-plan living room with a timber feature wall and light sofa',
      placeholder: true,
    },
    {
      title: 'Calm Bedroom',
      image: 'assets/img/project-2',
      alt: 'Bedroom with a dark textured wall, soft bedding and tall windows',
      placeholder: true,
    },
    {
      title: 'Dining Room',
      image: 'assets/img/project-3',
      alt: 'Dining room with green upholstered chairs around a long table and a round pendant light',
      placeholder: true,
    },
  ],
};
