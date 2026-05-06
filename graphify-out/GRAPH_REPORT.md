# Graph Report - jyotish-career  (2026-05-06)

## Corpus Check
- 104 files · ~283,440 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 365 nodes · 560 edges · 38 communities (29 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5aae5096`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 54 edges
2. `useAuth()` - 21 edges
3. `useGuestChart()` - 16 edges
4. `getLoginUrl()` - 15 edges
5. `CardDescription()` - 13 edges
6. `Skeleton()` - 12 edges
7. `Jyotish Career - Project TODO` - 12 edges
8. `Input()` - 11 edges
9. `Migration to Local Calculations - Summary` - 11 edges
10. `Badge()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `DashboardLayout()` --calls--> `useAuth()`  [INFERRED]
  client/src/components/DashboardLayout.tsx → client/src/_core/hooks/useAuth.ts
- `MigrationWrapper()` --calls--> `useMigration()`  [INFERRED]
  client/src/App.tsx → client/src/hooks/useMigration.ts
- `handleSignInToSave()` --calls--> `getLoginUrl()`  [INFERRED]
  client/src/pages/WealthStatus.tsx → client/src/const.ts
- `MapView()` --calls--> `usePersistFn()`  [INFERRED]
  client/src/components/Map.tsx → client/src/hooks/usePersistFn.ts
- `useAuth()` --calls--> `getLoginUrl()`  [INFERRED]
  client/src/_core/hooks/useAuth.ts → client/src/const.ts

## Communities (38 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (30): handleDialogKeyDown(), handleDialogSubmit(), Avatar(), AvatarFallback(), AvatarImage(), Breadcrumb(), BreadcrumbLink(), BreadcrumbPage() (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (12): generateGuestRecommendations(), generateTimingInsights(), AlertDialogAction(), AlertDialogCancel(), AlertDialogDescription(), AlertDialogTrigger(), Badge(), CardDescription() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (16): GuestChartProvider(), useGuestChart(), ThemeProvider(), useTheme(), useAuth(), useMigration(), useProfile(), handleKeyDown() (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (14): DashboardLayout(), DashboardLayoutSkeleton(), useIsMobile(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuTrigger(), SheetDescription() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (18): Alternative: PWA Builder, App Features for Store Listing, code:bash (npm install -g @anthropic/anthropic-sdk), code:bash (bubblewrap init --manifest https://your-domain.com/manifest.), code:json ([{), code:bash (keytool -list -v -keystore your-keystore.jks -alias your-ali), code:bash (bubblewrap build), Feature Graphic (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (7): FormControl(), FormDescription(), FormMessage(), useFormField(), Label(), SelectItem(), SelectTrigger()

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (17): 1. **Router Updates** (`server/routers.ts`), 2. **API Service Updates** (`server/astro/freeAstrologyApiService.ts`), 3. **Environment Configuration** (`.env`), Files Modified, ✨ Independence, Key Benefits, Local Calculation Capabilities, Migration Status (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (6): MapView(), useComposition(), usePersistFn(), useDialogComposition(), Input(), Textarea()

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (3): cn(), Checkbox(), PopoverTrigger()

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (12): Bug Fixes, Critical Bug Fixes, Free Astrology API Integration, Jyotish Career - Project TODO, New Features, Phase 1: Foundation, Phase 2: Core Astrological Engine, Phase 3: Career Database & Mapping (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.24
Nodes (8): formatDate(), generateAntardashas(), generateDashaTimeline(), generateDefaultDashaTimeline(), getUpcomingTransitions(), Tooltip(), TooltipContent(), TooltipProvider()

### Community 15 - "Community 15"
Cohesion: 0.38
Nodes (4): handleKeyDown(), handleSubmit(), scrollToBottom(), ScrollArea()

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (3): Carousel(), CarouselNext(), useCarousel()

## Knowledge Gaps
- **37 isolated node(s):** `Overview`, `1. **Router Updates** (`server/routers.ts`)`, `2. **API Service Updates** (`server/astro/freeAstrologyApiService.ts`)`, `3. **Environment Configuration** (`.env`)`, `✨ Independence` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 8` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 7`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 25`, `Community 26`, `Community 27`?**
  _High betweenness centrality (0.311) - this node is a cross-community bridge._
- **Why does `CardDescription()` connect `Community 1` to `Community 0`, `Community 2`, `Community 5`, `Community 10`, `Community 21`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `Input()` connect `Community 7` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `useAuth()` (e.g. with `DashboardLayout()` and `useMigration()`) actually correct?**
  _`useAuth()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `useGuestChart()` (e.g. with `useMigration()` and `useProfile()`) actually correct?**
  _`useGuestChart()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getLoginUrl()` (e.g. with `handleSignInToSave()` and `useAuth()`) actually correct?**
  _`getLoginUrl()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Overview`, `1. **Router Updates** (`server/routers.ts`)`, `2. **API Service Updates** (`server/astro/freeAstrologyApiService.ts`)` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._