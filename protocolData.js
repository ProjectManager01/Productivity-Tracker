// protocolData.js - Master Data & Science Reference for High-Performance Living in Bir-Billing

export const PROTOCOL_INFO = {
  title: "Productivity Tracker",
  subtitle: "Integrating Neuroplasticity, Endurance & Longevity in a High-Altitude Environment",
  altitude: "1,400m - 3,080m (Chowgan to Billing / Hanumangarh)",
  targetEvent: "Bir-Billing Marathon (42.2 km, 1,130m elevation gain, max alt 1,582m)",
  foundations: ["Andrew Huberman (Neurobiology)", "Wim Hof (Autonomic Regulation)", "David Goggins (Physical Resilience)"]
};

export const MASTER_TIMETABLE = [
  {
    id: "wake_hydrate",
    time: "06:00 AM",
    title: "Wake & Hydrate",
    category: "circadian",
    badge: "Circadian",
    description: "Consume 1 Liter of water with a pinch of sea salt.",
    rationale: "Replenishes overnight fluid loss, balances cellular electrolytes, and supports adrenal function for the upcoming run (Ref #16).",
    durationMins: 15,
    icon: "droplet"
  },
  {
    id: "wim_hof",
    time: "06:15 AM",
    title: "Wim Hof Breathwork",
    category: "autonomic",
    badge: "Autonomic",
    description: "30-40 cyclic hyperventilation breaths + breath retention on empty lungs + recovery hold.",
    rationale: "Spikes epinephrine, primes sympathetic nervous system, and induces intermittent hypoxia before endurance exertion (Ref #32).",
    durationMins: 15,
    action: "launchWimHof",
    icon: "wind"
  },
  {
    id: "morning_run",
    time: "06:30 AM",
    title: "Morning Run & Sun Exposure",
    category: "exercise",
    badge: "Marathon & Light",
    description: "Outdoor endurance training on Bir trails + direct ocular sunlight.",
    rationale: "Natural sunlight triggers retinal ganglion cells (ipRGCs) to stimulate Cortisol Awakening Response (CAR) and dopamine. Stimulates HIF-1α and EPO for altitude RBC adaptation (Ref #6, #11).",
    durationMins: 75,
    action: "logRun",
    icon: "activity"
  },
  {
    id: "cold_shower",
    time: "07:45 AM",
    title: "Cold Exposure & Hygiene",
    category: "autonomic",
    badge: "Dopamine",
    description: "2-3 minute cold shower (Cold Water Immersion / CWI).",
    rationale: "Dramatically spikes sustained baseline dopamine & norepinephrine. Placed early morning post-run to prevent mTOR blunting from evening calisthenics (Ref #34, #35).",
    durationMins: 15,
    action: "launchColdTimer",
    icon: "zap"
  },
  {
    id: "breakfast",
    time: "08:15 AM",
    title: "Breakfast & First Caffeine",
    category: "diet",
    badge: "Anabolism & Focus",
    description: "Air Fryer High-Protein Egg Bites (>30g protein). First coffee/tea permitted.",
    rationale: "Surpasses 2.5g leucine trigger. Caffeine delayed 90-120 min post-waking to ensure natural adenosine clearance and prevent afternoon crash (Ref #10, #59).",
    durationMins: 45,
    action: "viewRecipe_egg_bites",
    icon: "coffee"
  },
  {
    id: "deep_work_1",
    time: "09:00 AM",
    title: "Deep Work Block 1 (Ultradian)",
    category: "productivity",
    badge: "High Focus",
    description: "90-minute intense distraction-free cognitive focus bout.",
    rationale: "Capitalizes on peak morning cortisol & dopamine. Use 60s visual focus primer (acetylcholine) and 10s random micro-rests for hippocampal replay (Ref #10, #15, #19).",
    durationMins: 90,
    action: "launchDeepWork",
    icon: "target"
  },
  {
    id: "nsdr",
    time: "10:30 AM",
    title: "NSDR / Decompression",
    category: "productivity",
    badge: "Recovery",
    description: "10-20 minutes Yoga Nidra / Non-Sleep Deep Rest.",
    rationale: "Restores striatal dopamine baselines, clears cognitive fatigue, and consolidates newly encoded neural plasticity pathways (Ref #10, #29).",
    durationMins: 30,
    action: "launchNSDR",
    icon: "moon"
  },
  {
    id: "deep_work_2",
    time: "11:00 AM",
    title: "Deep Work Block 2 (Ultradian)",
    category: "productivity",
    badge: "Cognitive Peak",
    description: "90-minute second cognitive peak session.",
    rationale: "Utilize physiological sigh (double inhale, long slow exhale) whenever acute cognitive friction or stress rises (Ref #27, #28).",
    durationMins: 90,
    action: "launchDeepWork",
    icon: "cpu"
  },
  {
    id: "lunch",
    time: "12:30 PM",
    title: "Lunch: Anabolic Khichdi Bowl",
    category: "diet",
    badge: "Glycogen & MPS",
    description: "One-Pot High-Protein Soya Khichdi (1:1 Moong Dal + Rice + Soya Chunks).",
    rationale: "Delivers >30-35g complete protein with lysine/methionine complementarity and complex carbs to refill running glycogen stores (Ref #64, #70).",
    durationMins: 60,
    action: "viewRecipe_khichdi",
    icon: "utensils"
  },
  {
    id: "optic_flow",
    time: "01:30 PM",
    title: "Household Chores & Optic Flow",
    category: "productivity",
    badge: "Amygdala Calm",
    description: "Light ambulation, cleaning, dishwashing, or walking around Bir.",
    rationale: "Generates optic flow (lateral retinal motion) that down-regulates amygdala activity and clears autonomic stress while remaining functional (Ref #24).",
    durationMins: 60,
    icon: "sun"
  },
  {
    id: "deep_work_3",
    time: "02:30 PM",
    title: "Deep Work Block 3: Skill / Reading",
    category: "productivity",
    badge: "Neuroplasticity",
    description: "90 minutes of dedicated reading, language, or complex skill acquisition.",
    rationale: "Expect higher error rate during afternoon circadian dip; target ~15% error rate to release localized norepinephrine and signal synaptic remodeling (Ref #19, #21).",
    durationMins: 90,
    action: "launchDeepWork",
    icon: "book-open"
  },
  {
    id: "calisthenics",
    time: "04:30 PM",
    title: "Hypertrophy Calisthenics",
    category: "exercise",
    badge: "mTOR Hypertrophy",
    description: "45-60 minute bodyweight strength session. Upper/Lower split.",
    rationale: "Minimum 8 hours post-run to bypass the AMPK-mTOR molecular interference effect. Focus on mechanical disadvantage and 3-4s eccentric tempo (Ref #41, #49, #51).",
    durationMins: 60,
    action: "logCalisthenics",
    icon: "shield"
  },
  {
    id: "dinner",
    time: "06:00 PM",
    title: "Dinner: Air Fryer Paneer Tikka",
    category: "diet",
    badge: "Slow Casein",
    description: "150g Paneer + spiced hung curd marinade + bell peppers/onions.",
    rationale: "Slow-digesting casein protein maintains amino acid elevation throughout the 8.5-hour overnight fast, preventing nocturnal catabolism (Ref #58, #75).",
    durationMins: 60,
    action: "viewRecipe_paneer",
    icon: "award"
  },
  {
    id: "goggins_mobility",
    time: "07:00 PM",
    title: "Goggins Mobility Protocol",
    category: "exercise",
    badge: "Fascia & Longevity",
    description: "30-45 minutes static stretching (Couch stretch, Pigeon, Calves, Thoracic).",
    rationale: "Unglues tight running fascia, decompresses psoas, restores ankle dorsiflexion, and shifts nervous system into deep parasympathetic pre-sleep tone (Ref #53, #54).",
    durationMins: 60,
    action: "launchGogginsTimer",
    icon: "heart"
  },
  {
    id: "wind_down",
    time: "08:30 PM",
    title: "Wind Down & Light Dimming",
    category: "circadian",
    badge: "Melatonin",
    description: "Eliminate screens, block blue light, prepare cool bedroom environment.",
    rationale: "Allows endogenous melatonin surge to peak without retinal photic suppression (Ref #10, #12).",
    durationMins: 60,
    icon: "eye-off"
  },
  {
    id: "sleep",
    time: "09:30 PM",
    title: "Deep Sleep & Neuro-Consolidation",
    category: "circadian",
    badge: "8.5h Recovery",
    description: "Cool, pitch-black room. 8.5 hours uninterrupted sleep opportunity.",
    rationale: "Maximum growth hormone release, muscle repair, glymphatic brain waste clearance, and long-term memory consolidation (Ref #16, #18).",
    durationMins: 510,
    icon: "moon"
  }
];

export const WEEKLY_SCHEDULE = [
  {
    day: "Monday",
    shortDay: "Mon",
    runTitle: "Rest / Active Recovery",
    runDescription: "Light 30-min walking in Chowgan. Flush metabolic waste.",
    runVolume: "30 min Walk",
    runType: "recovery",
    strengthTitle: "Upper Body (Push Focus)",
    strengthDescription: "Progressions: Pseudo-planche push-ups, archer push-ups, parallel bar dips, wall handstand holds.",
    strengthFocus: "Chest, Anterior Deltoids, Triceps",
    tempo: "3-4s Eccentric"
  },
  {
    day: "Tuesday",
    shortDay: "Tue",
    runTitle: "Intervals / Tempo Run",
    runDescription: "45-60 mins sustained efforts at lactate threshold on rolling Bir terrain.",
    runVolume: "45-60 min Tempo",
    runType: "tempo",
    strengthTitle: "Lower Body (Unilateral Focus)",
    strengthDescription: "Pistol squats, shrimp squats, Nordic hamstring curls, explosive plyometric tuck jumps.",
    strengthFocus: "Quads, Hamstrings, Glutes, Calves",
    tempo: "3-4s Eccentric"
  },
  {
    day: "Wednesday",
    shortDay: "Wed",
    runTitle: "Easy Base Run (Zone 2)",
    runDescription: "60 mins conversational pace. Builds mitochondrial density and capillary beds.",
    runVolume: "60 min Zone 2",
    runType: "zone2",
    strengthTitle: "Upper Body (Pull Focus)",
    strengthDescription: "Dead-hang pull-ups, chin-ups, front lever tuck progressions, inverted rows using sturdy table or rings.",
    strengthFocus: "Lats, Rhomboids, Biceps, Core Compression",
    tempo: "3-4s Eccentric"
  },
  {
    day: "Thursday",
    shortDay: "Thu",
    runTitle: "Vertical Kilometer (VK) Hill Repeats",
    runDescription: "Steep trail ascents toward Billing launch site. Lower body power & altitude endurance.",
    runVolume: "5.5 km VK Simulation",
    runType: "hills",
    strengthTitle: "Extended Goggins Mobility & Rest",
    strengthDescription: "No heavy calisthenics. 60+ minutes deep static fascia release focusing on psoas, calves, and Achilles.",
    strengthFocus: "Fascia Release & Joint Decompression",
    tempo: "Deep Breathing"
  },
  {
    day: "Friday",
    shortDay: "Fri",
    runTitle: "Easy Base Run (Zone 2)",
    runDescription: "45 mins easy aerobic flush on flats around monastery trails.",
    runVolume: "45 min Zone 2",
    runType: "zone2",
    strengthTitle: "Full Body Compound Calisthenics",
    strengthDescription: "Compound volume: Explosive burpees, bar muscle-up progressions, strict L-sits, core hollow holds.",
    strengthFocus: "Full Kinetic Chain & Core Compression",
    tempo: "Controlled Explosive"
  },
  {
    day: "Saturday",
    shortDay: "Sat",
    runTitle: "The Progressive Long Run",
    runDescription: "90 - 150 mins on marathon route. Progressive distance. Eccentric downhill quad conditioning.",
    runVolume: "90-150 min Mountain Run",
    runType: "longrun",
    strengthTitle: "Rest & Active Recovery",
    strengthDescription: "Light foam rolling, gentle stretching, mineral hydration focus. No resistance training.",
    strengthFocus: "Systemic Recovery & Glycogen Refill",
    tempo: "Gentle"
  },
  {
    day: "Sunday",
    shortDay: "Sun",
    runTitle: "Complete Endurance Rest",
    runDescription: "Gentle walking or light morning yoga only.",
    runVolume: "Rest Day",
    runType: "rest",
    strengthTitle: "Meal Prep & Deep NSDR",
    strengthDescription: "Chop veggies, soak soya chunks, batch-prep paneer marinades. 45-min extended Yoga Nidra / NSDR.",
    strengthFocus: "Cognitive Integration & Weekly Reset",
    tempo: "Liminal Rest"
  }
];

export const RECIPES = [
  {
    id: "egg_bites",
    meal: "Breakfast",
    title: "Air Fryer High-Protein Egg Bites",
    subtitle: "Fast, Anabolic, Hands-Free Morning Protein Anchor",
    time: "15 mins (Hands-Free)",
    temp: "170°C (340°F) for 12-14 mins",
    appliances: ["Air Fryer", "Silicone Muffin Cups"],
    macros: {
      protein: "32-35g",
      carbs: "2g",
      fats: "15g",
      calories: "285 kcal",
      leucine: "3.1g (Surpasses mTOR Trigger)"
    },
    ingredients: [
      "3 whole large eggs",
      "1/2 cup liquid egg whites (or 3 separated whites)",
      "1/4 cup fat-free feta (or grated fresh low-fat paneer)",
      "1 generous handful chopped fresh spinach",
      "Pinch of pink Himalayan sea salt & black pepper",
      "1/4 tsp oregano or Italian herb mix (optional)"
    ],
    instructions: [
      "Whisk whole eggs, egg whites, salt, pepper, and herbs in a mixing bowl until light and aerated.",
      "Lightly oil 4-6 silicone muffin cups with olive oil spray.",
      "Divide chopped spinach and crumbled feta/paneer evenly across the silicone cups.",
      "Pour the whisked egg mixture over, filling only 3/4 of the way to allow for soufflé-like puffing in the air fryer.",
      "Preheat Air Fryer to 170°C (340°F). Place cups in the basket in a single layer.",
      "Air fry for 12 to 14 minutes until the tops are golden brown and centers are springy to the touch.",
      "Let cool 2 minutes; pop out seamlessly and consume with delayed morning espresso."
    ],
    videoLinks: [
      {
        title: "Air Fryer Egg Bites (Official Method)",
        url: "https://www.youtube.com/results?search_query=air+fryer+high+protein+egg+bites+spinach+feta",
        type: "video"
      },
      {
        title: "Just Add Egg & Soya Chunks High Protein Idea",
        url: "https://www.youtube.com/watch?v=fPPcNJINvYk",
        type: "video"
      }
    ],
    blogLinks: [
      {
        title: "High Protein Air Fryer Egg Bites - Health Beet",
        url: "https://healthbeet.org/high-protein-air-fryer-egg-bites/",
        type: "blog"
      },
      {
        title: "Air Fryer Egg Bites - Love And Other Spices",
        url: "https://www.loveandotherspices.com/air-fryer-egg-bites/",
        type: "blog"
      },
      {
        title: "Air Fryer Egg White Bites - Make It Skinny Please",
        url: "https://makeitskinnyplease.com/air-fryer-egg-white-bites/",
        type: "blog"
      },
      {
        title: "The BEST Air Fryer Egg Bites - Confetti & Bliss",
        url: "https://www.confettiandbliss.com/air-fryer-egg-bites/",
        type: "blog"
      },
      {
        title: "Air Fryer Egg Bites - American Egg Board",
        url: "https://www.incredibleegg.org/recipe/air-fryer-egg-bites/",
        type: "blog"
      }
    ]
  },
  {
    id: "khichdi",
    meal: "Lunch",
    title: "The Anabolic Khichdi Power Bowl",
    subtitle: "Complete Amino Acid Profile + Muscle Glycogen Replenishment",
    time: "15 mins active (12 mins pressure cook)",
    temp: "Pressure Cooker 3-4 Whistles (~12 mins)",
    appliances: ["Pressure Cooker or Instant Pot"],
    macros: {
      protein: "33-36g",
      carbs: "62g",
      fats: "8g",
      calories: "460 kcal",
      leucine: "2.8g (Optimized via 1:1 Ratio + Soya Chunks)"
    },
    ingredients: [
      "100g Moong Dal (split yellow - rich in lysine)",
      "100g Basmati Rice or Dalia (broken wheat - rich in methionine)",
      "30g Soya Chunks (52% protein density dry weight)",
      "1 tsp pure desi ghee",
      "1/2 tsp cumin seeds (jeera)",
      "1/2 tsp turmeric powder (haldi) & pinch of hing (asafoetida)",
      "1 green chili slit & 1 inch grated ginger",
      "600 ml water (3:1 water-to-grain ratio)",
      "Rock salt to taste"
    ],
    instructions: [
      "Soak soya chunks in boiling hot water with a pinch of salt for 8-10 minutes. Rinse under cold water and squeeze out all excess moisture thoroughly.",
      "Rinse the moong dal and rice/dalia together until water runs clear.",
      "In a pressure cooker, heat 1 tsp ghee. Add cumin seeds, hing, grated ginger, and slit green chili; let them crackle for 30 seconds.",
      "Add squeezed soya chunks and sauté for 1-2 minutes until lightly golden on the edges.",
      "Tip in the rinsed dal, rice/dalia, turmeric powder, and salt. Stir for 60 seconds to coat grains in aromatic ghee.",
      "Add 3 cups (600 ml) water. Close lid and pressure cook on medium-high for 3 to 4 whistles (approx. 12 minutes).",
      "Allow pressure to release naturally. Serve steaming hot with lemon squeeze or plain hung curd."
    ],
    videoLinks: [
      {
        title: "High Protein Soya Chunks Egg / Khichdi Idea (YouTube)",
        url: "https://www.youtube.com/watch?v=fPPcNJINvYk",
        type: "video"
      },
      {
        title: "Moong Dal & Dalia Power Khichdi Cooking Guide",
        url: "https://www.youtube.com/results?search_query=high+protein+khichdi+soya+chunks+dalia",
        type: "video"
      }
    ],
    blogLinks: [
      {
        title: "One-Pot High-Protein Khichdi (30g Per Bowl) - YourTrainer",
        url: "https://www.yourtrainer.in/blog/one-pot-high-protein-khichdi-pulao-recipes-india",
        type: "blog"
      },
      {
        title: "High-Protein Khichdi (Moong + Dalia Power Bowl) - KABO",
        url: "https://kabo.co.in/blogs/news/high-protein-khichdi-recipe",
        type: "blog"
      },
      {
        title: "Moong Dal Khichdi: Authentic Benefits - Organic Mandya",
        url: "https://organicmandya.com/blogs/news/moong-dal-khichdi-benefits-easy-recipe-step-by-step-authentic-indian",
        type: "blog"
      },
      {
        title: "Dal Khichdi Protein: Healthy Indian Recipe for Muscle - Natasha Mohan",
        url: "https://www.natashamohan.com/dal-khichdi-protein/",
        type: "blog"
      },
      {
        title: "Moong Dal Khichdi: Calories & GI Breakdown - Clearcals",
        url: "https://clearcals.com/recipes/moong-dal-khichdi/",
        type: "blog"
      }
    ]
  },
  {
    id: "paneer",
    meal: "Dinner",
    title: "Air Fryer High-Protein Paneer Tikka",
    subtitle: "Slow-Digesting Casein for Nocturnal Anabolism & Sleep Quality",
    time: "20 mins (plus 20 min marination)",
    temp: "200°C (400°F) for 12-14 mins (flip at 7m)",
    appliances: ["Air Fryer"],
    macros: {
      protein: "31g",
      carbs: "10g",
      fats: "20g",
      calories: "345 kcal",
      leucine: "2.9g (Pure Casein Delivery)"
    },
    ingredients: [
      "150g firm Paneer (cut into bite-sized 1-inch cubes)",
      "1/2 red or white onion (cut into squares)",
      "1/2 green bell pepper / capsicum (cut into squares)",
      "4 tbsp thick hung curd (or plain Greek yogurt)",
      "1 tsp ginger-garlic paste",
      "1 tsp authentic tandoori masala / garam masala",
      "1/2 tsp Kashmiri red chili powder (for color)",
      "1 tsp pure cold-pressed mustard oil (kachhi ghani)",
      "1 tbsp freshly squeezed lemon juice",
      "Rock salt & chaat masala to garnish"
    ],
    instructions: [
      "In a bowl, whisk hung curd, mustard oil, ginger-garlic paste, tandoori masala, red chili, lemon juice, and salt until a thick aromatic marinade forms.",
      "Toss the paneer cubes, onion squares, and bell pepper into the bowl, ensuring every surface is thickly coated.",
      "Let marinate at room temperature for at least 20-30 minutes (or batch prep on Sunday for the entire week).",
      "Preheat your Air Fryer to 200°C (400°F) for 3 minutes.",
      "Arrange marinated paneer and veggies in a single layer in the air fryer basket (do not overcrowd).",
      "Air fry for 12-14 minutes, pausing at the 7-minute mark to gently flip the cubes with silicone tongs.",
      "Remove when edges develop authentic charred tandoor spots. Sprinkle chaat masala and enjoy with a light salad."
    ],
    videoLinks: [
      {
        title: "Air Fryer Crispy Paneer Tikka Restaurant Style",
        url: "https://www.youtube.com/results?search_query=air+fryer+paneer+tikka+high+protein",
        type: "video"
      }
    ],
    blogLinks: [
      {
        title: "Paneer Tikka Air Fryer: 30g Protein in 25 Mins - YourTrainer",
        url: "https://www.yourtrainer.in/blog/paneer-tikka-air-fryer-recipe-high-protein-indian-snack",
        type: "blog"
      },
      {
        title: "Air Fryer Paneer Tikka Recipe - Wonderchef",
        url: "https://www.wonderchef.com/blogs/recipes/air-fryer-paneer-tikka-recipe-quick-healthy-indian-snack",
        type: "blog"
      },
      {
        title: "Paneer Tikka Recipe: Oven, Tawa & Air Fryer - NNWA",
        url: "https://nnwa.in/recipes/paneer-tikka/",
        type: "blog"
      },
      {
        title: "Air Fryer Paneer Tikka for Weight Loss - Flavor Quotient",
        url: "https://flavorquotient.com/2025/05/high-protein-air-fryer-paneer-tikka-for-weight-loss/",
        type: "blog"
      },
      {
        title: "Paneer Tikka in Air Fryer / Grill - Spice Cravings",
        url: "https://spicecravings.com/paneer-tikka",
        type: "blog"
      }
    ]
  }
];

export const WORKOUT_PROGRESSIONS = {
  calisthenics: [
    {
      category: "Push (Upper Body)",
      movements: [
        { name: "Pseudo-Planche Push-Ups", target: "Shoulders/Chest/Levers", cue: "Fingers turned 45°, shoulders protracted forward beyond wrists, hollow body." },
        { name: "Archer Push-Ups", target: "Unilateral Pectoral Tension", cue: "Wide stance, lower to one side while opposite arm extends straight." },
        { name: "Parallel Bar Dips", target: "Lower Pectorals & Triceps", cue: "Slight forward torso lean, 90° elbow break, full lockout." },
        { name: "Wall Handstand Holds / HSPU", target: "Vertical Shoulder Strength", cue: "Ribs tucked, active shoulder shrug at the apex." }
      ]
    },
    {
      category: "Pull (Upper Body)",
      movements: [
        { name: "Hollow-Body Pull-Ups", target: "Latissimus Dorsi", cue: "Legs straight forward in hollow hold, chest up to touch bar." },
        { name: "Chest-to-Bar Chin-Ups", target: "Biceps & Mid-Back", cue: "Underhand grip, drive elbows down into back pockets." },
        { name: "Front Lever Progression (Tuck/Straddle)", target: "Straight-Arm Lat Power", cue: "Depress scapulae, pull down with straight elbows." },
        { name: "Inverted Bodyweight Rows", target: "Rhomboids & Rear Delts", cue: "Using sturdy table edge or gymnastics rings, 2-sec peak squeeze." }
      ]
    },
    {
      category: "Lower Body (Legs & Plyos)",
      movements: [
        { name: "Pistol Squats (Single Leg)", target: "Quad Leverage & Balance", cue: "Extended non-working leg straight, knee tracks second toe, 3s down." },
        { name: "Shrimp Squats", target: "Posterior Chain & Glute Max", cue: "Rear ankle held behind glute, tap back knee softly to floor." },
        { name: "Nordic Hamstring Curls (Doorway/Bed Hook)", target: "Eccentric Hamstring Resilience", cue: "Keep hips fully extended, descend as slowly as possible." },
        { name: "Explosive Mountain Plyo Jumps", target: "Tendon Elastic Recoil", cue: "Quick ground contact time, high knee drive." }
      ]
    }
  ],
  mobility: [
    {
      target: "Psoas & Hip Flexors",
      protocol: "The Couch Stretch (Long Hold)",
      duration: "3 - 5 minutes per side",
      why: "Goggins: 'Psoas is the soul of the body'. Reverses lumbar lordosis & pelvic tilt from mountain running (Ref #53, #54).",
      videoUrl: "https://www.youtube.com/results?search_query=couch+stretch+hip+flexor+psoas"
    },
    {
      target: "Glutes & Piriformis",
      protocol: "Seated Figure-4 or Deep Pigeon Pose",
      duration: "3 minutes per side",
      why: "Decompresses posterior hip capsule, prevents sciatic nerve compression and maintains running stride length (Ref #54).",
      videoUrl: "https://www.youtube.com/results?search_query=pigeon+pose+piriformis+stretch"
    },
    {
      target: "Calves & Achilles Tendons",
      protocol: "70-Degree Slant Board / Doorway Calf Stretch",
      duration: "2 - 3 minutes per leg",
      why: "Essential for Bir elevation gains; restores ankle dorsiflexion, prevents plantar fasciitis & Achilles tendinitis (Ref #53).",
      videoUrl: "https://www.youtube.com/results?search_query=slanted+board+calf+stretch+goggins"
    },
    {
      target: "Thoracic Spine & Shoulders",
      protocol: "Doorway Chest Openers & Overhead Lat Stretch",
      duration: "2 - 3 minutes total",
      why: "Counteracts forward-slumped desk posture and running hunch, expanding rib cage and vital lung capacity (Ref #53).",
      videoUrl: "https://www.youtube.com/results?search_query=doorway+chest+stretch+thoracic"
    }
  ]
};

export const PROTOCOL_CITATIONS = [
  { id: 1, title: "Bir-Billing Marathon & Terrain Elevation (1,130m gain)", url: "https://www.citywoofer.com/e/bir-billing-marathon" },
  { id: 6, title: "Altitude Acclimatization, HIF-1a & EPO Synthesis (PMC9368232)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9368232/" },
  { id: 10, title: "Huberman Daily Protocol & Tracker Guide", url: "https://timespent.so/blog/huberman-daily-protocol/" },
  { id: 11, title: "Morning Sunlight & Cortisol Awakening Response (CAR)", url: "https://lifestack.ai/blog/huberman-morning-routine" },
  { id: 15, title: "Hippocampal Replay & 10s Gap Learning", url: "https://www.scribd.com/document/975968874/90-Day-Career-Acceleration-Roadmap" },
  { id: 16, title: "The Daily Blueprint - Huberman Lab", url: "https://www.hubermanlab.com/daily-blueprint" },
  { id: 19, title: "Visual Focus & Acetylcholine Primer Protocol", url: "https://nigelpdaly.com/2022/12/12/hubermans-neuroplasticity-super-protocol-translating-neuroscience-research-into-teaching-protocols/" },
  { id: 24, title: "Optic Flow & Amygdala Stress Down-Regulation", url: "https://www.readandrewhuberman.com/p/easter-comfort-crisis/" },
  { id: 27, title: "Physiological Sigh for Autonomic Vagal Regulation", url: "https://biobrain.blog/en/blog/the-physiological-sigh-a-science-backed-tool-for-rapid-stress-regulation/" },
  { id: 32, title: "Wim Hof Breathing & Cold Exposure Synergy", url: "https://fjordcoldplunge.com/blogs/news/cold-plunge-and-breathwork-how-to-combine-them-for-maximum-benefit" },
  { id: 35, title: "Cold Water Immersion Hypertrophy Blunting (PMC11235606)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11235606/" },
  { id: 41, title: "Concurrent Endurance vs Resistance Interference (ResearchGate)", url: "https://www.researchgate.net/publication/400197831_The_effects_mechanisms_and_influencing_factors_of_concurrent_strength_and_endurance_training_with_different_sequences_a_semi-systematic_review" },
  { id: 51, title: "Eccentric Tempo (3-4s) & Hypertrophy Signaling (PubMed)", url: "https://pubmed.ncbi.nlm.nih.gov/35309524/" },
  { id: 52, title: "Build a Powerful Upper Body with Calisthenics (YouTube)", url: "https://www.youtube.com/watch?v=I1eTujgertE" },
  { id: 53, title: "David Goggins Nightly Stretching Routine", url: "https://benefitsofstretching.com/david-goggins-stretching-routine/" },
  { id: 56, title: "David Goggins Stretching Routines Revealed (YouTube)", url: "https://www.youtube.com/watch?v=mTmRjK1ZBuk" },
  { id: 59, title: "The Leucine Trigger Hypothesis & mTOR Activation", url: "https://fitchef.com/shorts/older-adults-leucine-per-meal/" },
  { id: 64, title: "Moong Dal & Rice Amino Acid Complementarity", url: "https://organicmandya.com/blogs/news/moong-dal-khichdi-benefits-easy-recipe-step-by-step-authentic-indian" },
  { id: 70, title: "One-Pot High-Protein Khichdi (30g Protein)", url: "https://www.yourtrainer.in/blog/one-pot-high-protein-khichdi-pulao-recipes-india" },
  { id: 71, title: "High-Protein Khichdi (Moong + Dalia Bowl) 2026", url: "https://kabo.co.in/blogs/news/high-protein-khichdi-recipe" },
  { id: 72, title: "Just Add 1 Egg to Soya Chunks (YouTube Recipe)", url: "https://www.youtube.com/watch?v=fPPcNJINvYk" },
  { id: 75, title: "Paneer Tikka Air Fryer: 30g Protein in 25 Mins", url: "https://www.yourtrainer.in/blog/paneer-tikka-air-fryer-recipe-high-protein-indian-snack" }
];
