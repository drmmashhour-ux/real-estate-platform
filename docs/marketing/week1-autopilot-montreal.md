# Week 1 Controlled Marketing Autopilot: Montreal

This document describes the architecture and workflow for the Week 1 Montreal marketing launch.

## Overview

The Goal is to generate a full 7-day marketing pipeline for Montreal with localized content for specific focus areas, audiences, and goals. All content is generated in `READY_FOR_APPROVAL` mode to ensure human-in-the-loop quality control before any platform publishing occurs.

## Target Configuration

- **City**: Montreal
- **Focus Areas**: Griffintown, Downtown, Old Montreal, Westmount, Laval
- **Audiences**: Buyers, Investors, Brokers
- **Goals**: Lead Generation, Broker Acquisition, Brand Awareness

## Content Generation Logic

The `marketing-week-plan.service.ts` handles the deterministic generation of ~25–28 content items per week.

### Distribution Mix
- **30% Listings Showcase**: Focus on high-end properties in target areas.
- **25% Broker Recruitment**: Highlighting LECIPM's lead routing and tech benefits for local brokers.
- **25% Investor Opportunity**: Market trends, yield analysis, and ROI logic for Montreal neighborhoods.
- **20% Lifestyle / Location**: Local hidden gems, coffee shops, and neighborhood vibes.

### Daily Cadence
- **2 Short-form Videos**: TikTok and Instagram Reels.
- **1 Poster**: Instagram feed post.
- **1 Story**: Lifestyle or quick update.

## Auto-Video Engine Integration

For every Video item, the system automatically:
1. Creates an `AutoVideoRequest`.
2. Generates a 4-scene storyboard (Hook, Problem, Solution, CTA).
3. Produces a `AutoVideoRenderManifestV1` for the renderer.
4. Applies LECIPM luxury branding (Black + Gold).

## Approval Workflow

1. **Generation**: Admin triggers "Generate Week 1 Plan".
2. **Review**: Admin reviews the plan in the `/dashboard/admin/marketing/week-plan` dashboard.
3. **Validation**: The Quality Check Engine (`marketing-week-plan-validation.service.ts`) flags issues like short hooks, missing CTAs, or missing city references.
4. **Edit**: Admin can edit captions or scripts before approval.
5. **Approve**: Admin approves individual items or the whole plan.
6. **Deploy**: Once approved, the plan is deployed to the **Content Calendar** with specific time slots (11:00, 14:00, 19:00).

## Transition to Autopilot

After Week 1 is successfully validated and posted manually, the system can be moved to `SAFE_AUTOPILOT` mode where content is automatically scheduled but still requires a final "Approve All" click daily. Full autopilot is reserved for future versions.

## Performance Tracking

The system initializes a performance baseline for each piece of content. Attributed views, clicks, and leads will be synced back to the dashboard once publishing begins.
