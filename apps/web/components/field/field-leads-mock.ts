export type FieldBrokerLead = {
  id: string;
  brokerName: string;
  phone: string;
  location: string;
  status: "à visiter" | "relance" | "qualifié" | "perdu";
};

/** Seed data for field specialists — replace with CRM / API later. */
export const FIELD_MOCK_LEADS: FieldBrokerLead[] = [
  {
    id: "fld-1",
    brokerName: "Marc-André Tremblay",
    phone: "+1 514-555-0142",
    location: "Montréal — Plateau",
    status: "à visiter",
  },
  {
    id: "fld-2",
    brokerName: "Sophie Nguyen",
    phone: "+1 450-555-0198",
    location: "Laval — Chomedey",
    status: "à visiter",
  },
  {
    id: "fld-3",
    brokerName: "Jean-François Morin",
    phone: "+1 418-555-0167",
    location: "Québec — Sainte-Foy",
    status: "relance",
  },
  {
    id: "fld-4",
    brokerName: "Amélie Gagnon",
    phone: "+1 514-555-0120",
    location: "Longueuil — Vieux-Longueuil",
    status: "qualifié",
  },
  {
    id: "fld-5",
    brokerName: "Karim El Mansouri",
    phone: "+1 514-555-0189",
    location: "Westmount",
    status: "à visiter",
  },
];
