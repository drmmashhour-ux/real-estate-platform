/**
 * Global Property Data Graph – node and edge type definitions.
 * Graph entities are derived from existing relational data; semantic edges
 * (SIMILAR_TO, SAME_AREA, SAME_MARKET) are stored in PropertyGraphEdge.
 */

export const NODE_TYPES = [
  "PROPERTY",
  "USER",
  "OWNER",
  "BROKER",
  "LISTING",
  "BOOKING",
  "TRANSACTION",
  "VALUATION",
  "MARKET",
  "FRAUD_EVENT",
  "SAFETY_INCIDENT",
  "REVIEW",
  "PAYMENT",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const EDGE_TYPES = [
  "OWNED_BY",
  "LISTED_BY",
  "BROKERED_BY",
  "HAS_LISTING",
  "HAS_BOOKING",
  "HAS_TRANSACTION",
  "HAS_VALUATION",
  "IN_MARKET",
  "HAS_FRAUD_EVENT",
  "HAS_SAFETY_INCIDENT",
  "CREATED_BY",
  "LINKED_TO",
  "HAS_REVIEW",
  "HAS_PAYMENT",
  "BOOKED_BY",
  "GENERATED_INCIDENT",
  "BUYER",
  "SELLER",
  "BROKER",
  "SIMILAR_TO",
  "SAME_AREA",
  "SAME_MARKET",
  "SAME_BUILDING",
] as const;

export type EdgeType = (typeof EDGE_TYPES)[number];

export interface GraphNode {
  id: string;
  type: NodeType;
  data: Record<string, unknown>;
  createdAt?: string;
}

export interface GraphEdge {
  id: string;
  fromType: NodeType;
  fromId: string;
  toType: NodeType;
  toId: string;
  edgeType: EdgeType;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface PropertyGraphView {
  property: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface PropertyHistoryEntry {
  eventType: string;
  at: string;
  entityType: string;
  entityId: string;
  data?: Record<string, unknown>;
}
