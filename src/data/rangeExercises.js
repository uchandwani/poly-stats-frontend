export const rangeExercises = [
  {
    code: "Basics_01",
    statMeasure: "Range",
    title: "Explore Range with Different Concepts",
    description: "A set of hands-on tasks to understand how range behaves across different datasets.",
    inputType: "mixed", // means some variants are raw, some grouped

    variants: [
      {
        variantId: "dispersion",
        label: "Same Range, Different Spread",
        inputType: "raw",
        datasets: [
          { label: "Set A", data: [40, 46, 47, 48, 49, 60] },
          { label: "Set B", data: [40, 40, 40, 60, 60, 60] }
        ],
        prompt: "Do both datasets feel equally spread? Why or why not?",
        expected: { range: 20 },
        allowStudentReasoning: true
      },

      {
        variantId: "scale",
        label: "Same Range, Different Scale",
        inputType: "raw",
        datasets: [
          { label: "Set A", data: [32, 35, 36, 37, 38, 39, 47] },
          { label: "Set B", data: [232, 235, 236, 237, 238, 239, 247] }
        ],
        prompt: "Does the same range tell you the same thing in both cases?",
        expected: {
          range: 15,
          coefficientA: 15 / (47 + 32),
          coefficientB: 15 / (247 + 232)
        },
        allowStudentReasoning: true
      },

      {
        variantId: "outlier",
        label: "Effect of Outliers on Range",
        inputType: "raw",
        datasets: [
          { label: "Without Outlier", data: [45, 47, 48, 49, 50, 51, 52] },
          { label: "With Outlier", data: [45, 47, 48, 49, 50, 51, 99] }
        ],
        prompt: "How does a single extreme value affect range?",
        expected: {
          rangeWithout: 52 - 45,
          rangeWith: 99 - 45
        },
        allowStudentReasoning: true
      },

      {
        variantId: "grouped",
        label: "Grouped Class Intervals",
        inputType: "grouped",
        classIntervals: [
          [10, 20],
          [20, 30],
          [30, 40],
          [40, 50],
          [50, 60]
        ],
        frequencies: [5, 7, 4, 8, 6],
        prompt: "Estimate the range and coefficient from class boundaries.",
        expected: {
          range: 60 - 10,
          coefficient: 50 / 70 // (max - min) / (max + min)
        },
        allowStudentReasoning: true
      }
    ]
  }
];
