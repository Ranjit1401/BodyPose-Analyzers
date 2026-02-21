const exerciseConfig = {
  burpees: {
    label: "Burpees",
    mode: "reps",
    needsWeight: false,
    needsTimer: false,
    questions: [
      "How many burpees would you like to perform?",
    ],
  },

  dumbbells: {
    label: "Dumbbells",
    mode: "reps",
    needsWeight: true,
    needsTimer: false,
    questions: [
      "What weight are you lifting?",
      "How many repetitions are you targeting?",
    ],
  },

  jumping_jacks: {
    label: "Jumping Jacks",
    mode: "reps",
    needsWeight: false,
    needsTimer: false,
    questions: [
      "How many jumping jacks would you like to do?",
    ],
  },

  planks: {
    label: "Plank",
    mode: "timer",
    needsWeight: false,
    needsTimer: true,
    questions: [
      "How many seconds would you like to hold the plank?",
    ],
  },

  pilates: {
    label: "Pilates",
    mode: "timer",
    needsWeight: false,
    needsTimer: true,
    questions: [
      "How many minutes would you like this pilates session to be?",
    ],
  },

  pushup: {
    label: "Pushups",
    mode: "reps",
    needsWeight: false,
    needsTimer: false,
    questions: [
      "How many pushups are you targeting?",
    ],
  },

  resistance_band: {
    label: "Resistance Band",
    mode: "reps",
    needsWeight: false,
    needsTimer: false,
    questions: [
      "How many repetitions are you planning?",
    ],
  },

  running_in_place: {
    label: "Running In Place",
    mode: "timer",
    needsWeight: false,
    needsTimer: true,
    questions: [
      "How many minutes would you like to run in place?",
    ],
  },

  squats: {
    label: "Squats",
    mode: "reps",
    needsWeight: false,
    needsTimer: false,
    questions: [
      "How many squats would you like to perform?",
    ],
  },

  steps: {
    label: "Steps",
    mode: "reps",
    needsWeight: false,
    needsTimer: false,
    questions: [
      "How many step repetitions are you targeting?",
    ],
  },

  yoga: {
    label: "Yoga",
    mode: "timer",
    needsWeight: false,
    needsTimer: true,
    questions: [
      "How long would you like this yoga session to be?",
    ],
  },

  zumba: {
    label: "Zumba",
    mode: "timer",
    needsWeight: false,
    needsTimer: true,
    questions: [
      "How many minutes would you like to do zumba?",
    ],
  },
  youtube_import: {
  label: "Custom YouTube Exercise",
  mode: "custom",
  needsWeight: false,
  needsTimer: true,
  questions: [
    "Please paste the YouTube video link.",
    "Is this repetition based or timer based?",
    "How many reps or how many seconds?"
  ],
},

};

export default exerciseConfig;
