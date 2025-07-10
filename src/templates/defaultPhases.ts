export interface DefaultPhase {
  name: string;
  description: string;
  order_index: number;
  checklist: string[];
}

export const defaultPhases: DefaultPhase[] = [
  {
    name: "Project Planning",
    description: "Initial project setup and planning phase",
    order_index: 1,
    checklist: [
      "Review project requirements and specifications",
      "Conduct site survey and assessment",
      "Obtain necessary permits and approvals",
      "Finalize project timeline and milestones",
      "Prepare detailed budget breakdown"
    ]
  },
  {
    name: "Site Preparation",
    description: "Prepare the construction site for work",
    order_index: 2,
    checklist: [
      "Clear and excavate the site",
      "Set up temporary utilities",
      "Install safety barriers and signage",
      "Establish material storage areas",
      "Conduct soil testing if required"
    ]
  },
  {
    name: "Foundation Work",
    description: "Foundation and structural groundwork",
    order_index: 3,
    checklist: [
      "Layout foundation according to plans",
      "Excavate foundation to required depth",
      "Install foundation forms and reinforcement",
      "Pour and cure concrete foundation",
      "Conduct foundation inspection"
    ]
  },
  {
    name: "Structural Work",
    description: "Main structural construction",
    order_index: 4,
    checklist: [
      "Install structural framing",
      "Complete electrical rough-in",
      "Complete plumbing rough-in",
      "Install HVAC system rough-in",
      "Conduct structural inspection"
    ]
  },
  {
    name: "Finishing Work",
    description: "Interior and exterior finishing",
    order_index: 5,
    checklist: [
      "Install insulation and drywall",
      "Complete interior painting",
      "Install flooring materials",
      "Install fixtures and appliances",
      "Complete exterior work and landscaping"
    ]
  },
  {
    name: "Final Inspection",
    description: "Final inspections and project completion",
    order_index: 6,
    checklist: [
      "Conduct final walkthrough",
      "Complete all punch list items",
      "Obtain final inspections and certificates",
      "Deliver project documentation",
      "Hand over keys and project to client"
    ]
  }
];