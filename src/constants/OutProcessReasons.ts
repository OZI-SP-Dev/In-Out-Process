export const OUT_PROCESS_REASONS = [
  {
    key: "Transferring",
    text: "Transferring",
    items: [
      {
        key: "Move within AFLCMC organization",
        text: "Move within AFLCMC organization",
      },
      {
        key: "Move within AFMC organization",
        text: "Move within AFMC organization",
      },
      {
        key: "Move within AF organization",
        text: "Move within AF organization",
      },
    ],
  },
  {
    key: "Separating",
    text: "Separating",
    items: [
      {
        // Note:  If this text changes -- ensure the exemption conditional statement is also updated in CreateChecklistItems
        key: "Move to non-AF DOD organization",
        text: "Move to non-AF DOD organization",
      },
      {
        key: "Move to external (Non-DOD government / Non-government) job",
        text: "Move to external (Non-DOD government / Non-government) job",
      },
      {
        key: "Move to external (government related contractor) job",
        text: "Move to external (government related contractor) job",
      },
      { key: "Other", text: "Other" },
    ],
  },
  {
    key: "Retiring",
    text: "Retiring",
    items: [{ key: "Retiring", text: "Retiring" }],
  },
];
