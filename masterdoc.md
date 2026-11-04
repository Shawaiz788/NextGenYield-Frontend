# NextGenYeild: Crop & AI Detector
## Comprehensive Master System & Project Specification

> **Project Name:** NextGenYeild: Crop & AI Detector  
> **Document Purpose:** Single-source-of-truth master document compiling all architectural, scientific, operational, and development details of the FYP.  
> **Author / Maintainer:** Shawaiz & Team (FYP)  
> **Target Environment:** Mobile-first Farmer Companion & Agronomic Decision Support System  
> **Last Updated:** September 2026  

---

## Table of Contents
1. [Executive Summary & Official Abstract](#1-executive-summary--official-abstract)
2. [High-Level Vision & Core Problem Statement](#2-high-level-vision--core-problem-statement)
3. [End-to-End Conceptual Architecture](#3-end-to-end-conceptual-architecture)
4. [Hardware, Software & Runtime Environment](#4-hardware-software--runtime-environment)
5. [Foundation Model Architecture: FoMo4Wheat](#5-foundation-model-architecture-fomo4wheat)
6. [Downstream Growth Stage Classification (WGSP)](#6-downstream-growth-stage-classification-wgsp)
7. [Dataset Architecture & Ingestion Standards](#7-dataset-architecture--ingestion-standards)
8. [Temporal Crop Growth Monitoring (The Timeline Engine)](#8-temporal-crop-growth-monitoring-the-timeline-engine)
9. [Rule-Based Agronomic Decision Support Engine](#9-rule-based-agronomic-decision-support-engine)
10. [Image Quality & Angle Compliance Engine (Pre-Inference Edge Guardrail)](#10-image-quality--angle-compliance-engine-pre-inference-edge-guardrail)
11. [Collective Farm Intelligence & Geospatial Field Mapping](#11-collective-farm-intelligence--geospatial-field-mapping)
12. [Peer Field Benchmarking & Best-Practice Showcase (Yield Return / m²)](#12-peer-field-benchmarking--best-practice-showcase-yield-return--m)
13. [System Integration, REST API & Data Schemas](#13-system-integration-rest-api--data-schemas)
14. [Farmer Mobile Application UX & Interactive Interfaces](#14-farmer-mobile-application-ux--interactive-interfaces)
15. [Project Scope Boundaries (Refined & Clarified)](#15-project-scope-boundaries-refined--clarified)
16. [18-Phase Master Roadmap & Progress Tracker](#16-18-phase-master-roadmap--progress-tracker)
17. [Historical Experiment Log & Benchmark Records](#17-historical-experiment-log--benchmark-records)
18. [Developer & AI Assistant Operational Cheat Sheet](#18-developer--ai-assistant-operational-cheat-sheet)

---

## 1. Executive Summary & Official Abstract

### Official Abstract (Academic Report Standard)
> Accurate identification of wheat phenological stages is critical for optimizing agronomic interventions and preventing yield loss. This project presents an intelligent crop monitoring and decision-support system utilizing the FoMo4Wheat agricultural vision foundation model. A downstream classification head is integrated on top of the frozen transformer representations to categorize wheat canopy imagery into six key growth stages, from tillering to maturity. Sequential observations are logged into a temporal growth timeline, which feeds a rule-based agronomic engine to guide farmers on optimal irrigation, nutrient timing, and risk prevention. Ultimately, this framework bridges deep representation learning with practical farm advisory, providing an accessible, data-driven companion for precision crop management.
*(5 sentences · 104 words · Single paragraph)*

### Alternative Abstract (With Project Title *NextGenYeild*)
> Timely identification of crop phenological stages is essential for scheduling farm interventions and safeguarding harvest yields. This work presents NextGenYeild, a crop monitoring and advisory framework built upon the FoMo4Wheat vision foundation model. By attaching a downstream classification head to the frozen pre-trained backbone, the system classifies field canopy imagery across six wheat growth stages and maintains a temporal observation timeline. These stage transitions are coupled with an agronomic decision-support engine to provide farmers with actionable guidance regarding irrigation, fertilizer application, and proactive hazard prevention.
*(4 sentences · 85 words · Single paragraph)*

---

## 2. High-Level Vision & Core Problem Statement

### The Problem in Traditional Agriculture
1. **Timing Mismatch:** Agricultural inputs (nitrogen fertilizers, fungicides, critical irrigations) have narrow, stage-dependent windows of efficacy. Applying fertilizer at the wrong growth stage results in severe nitrogen leaching, wasted expenditure, or vegetative lodging rather than grain yield.
2. **Subjectivity & Human Error:** Farmers assess growth stages using visual heuristics or calendar days from sowing. However, weather fluctuations, microclimates, and seed varieties cause substantial phenological shifts that calendar dates cannot account for.
3. **Black-box / Hallucinated Advice:** Existing consumer agricultural apps often provide generic calendar advice or rely on ungrounded Large Language Models (LLMs) that fabricate fertilizer dosages, risking crop toxicity and financial ruin.
4. **Information Silos & Agronomic Isolation:** Smallholder farmers operate in isolation with zero visibility into which wheat cultivars, fertilizer split schedules, or irrigation methods succeed in neighboring plots under identical soil and weather conditions.
5. **Degraded Field Photography & Garbage-In/Garbage-Out:** Handheld smartphone photos taken by farmers in the field frequently suffer from severe motion blur, wind shake, poor lighting, or improper horizontal angles (pointing at stems/weeds instead of the canopy), degrading AI inference without user awareness.

### The NextGenYeild Solution
NextGenYeild provides an AI-powered, mobile-first precision agriculture companion that bridges deep representation learning with collective field intelligence:
1. **Real-Time Image Quality & Angle Guardrail:** Instant edge-based verification ensuring canopy photos are sharp, well-lit, and captured at proper oblique-to-downward angles ($45^\circ - 90^\circ$) before inference.
2. **Accurate Phenological Classification:** Using a specialized crop vision foundation model (FoMo4Wheat) frozen representations for robust 6-stage phenotyping.
3. **Temporal Growth Tracking:** Maintaining sequential field observation timelines to monitor phenological velocity and detect anomalies.
4. **Deterministic, Evidence-Based Decision Support:** Directly mapping stage progression to verified agronomic protocols (irrigation, nutrients, rust prevention).
5. **Collective Geospatial Farm Intelligence:** An interactive GIS map showcasing participating farm fields with color-coded growth stages, allowing farmers to tap any field to inspect its historical profile (seed variety, fertilizer regimen, irrigation history, and yield).
6. **Peer Benchmarking & Best-Practice Showcase:** A community showcase highlighting top-performing fields (highest yield return per square meter) designed explicitly for collaborative learning and technique replication rather than competitive gamification.

---

## 3. End-to-End Conceptual Architecture

The NextGenYeild ecosystem operates across six strictly decoupled architectural layers:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Layer 1: Farmer Smartphone Application                          │
│   • Camera Viewfinder with Real-Time HUD (Orientation Level, Angle Reticle, Blur Meter)│
│   • GIS Map View (Color-coded fields, stage overlays, interactive field inspector)     │
│   • Field Growth Timeline & Deterministic Agronomic Advisory Cards                     │
│   • Peer Best-Practice Showcase (Highest yield return per m², input recipe viewer)     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Multipart Image / JSON Requests
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Layer 2: Backend REST API & Gateways                            │
│   • Authentication, Session Tokens & Rate Limiting                                     │
│   • Quality Pre-Filter Service (Sharpness & Angle Classification Gatekeeper)           │
│   • Geospatial PostGIS Engine (Field polygon CRUD, spatial indexing, nearby search)    │
│   • Benchmarking & Best-Practice Aggregation Service                                   │
└─────────────────────┬─────────────────────────────────────────────────┬────────────────┘
                      │ High-Quality Canopy Image                       │
                      ▼                                                 │
┌──────────────────────────────────────────────────────────────┐        │
│                Layer 3: AI Inference Service                 │        │
│                                                              │        │
│   [ Input RGB Image ] (518×518, Bicubic, ImageNet Norm)      │        │
│          │                                                   │        │
│          ▼                                                   │        │
│   ┌────────────────────────────────────────────────────────┐ │        │
│   │  FoMo4Wheat ViT-B/14 Backbone (FROZEN Backbone)        │ │        │
│   │  • 86.6M Parameters pre-trained on 2.5M wheat images   │ │        │
│   │  • xFormers Memory-Efficient Attention                 │ │        │
│   └──────────────────────────┬─────────────────────────────┘ │        │
│                              │                               │        │
│              ┌───────────────┴───────────────┐               │        │
│              ▼                               ▼               │        │
│      [ CLS Token (768-D) ]       [ Patch Tokens (1369×768) ] │        │
│              │                               │               │        │
│              └───────────────┬───────────────┘               │        │
│                              ▼                               │        │
│        [ Concatenated / Pooled Vector (1536-D) ]             │        │
│                              │                               │        │
│                              ▼                               │        │
│   ┌────────────────────────────────────────────────────────┐ │        │
│   │  Downstream Linear Probing Head (Linear(1536, 6))      │ │        │
│   └──────────────────────────┬─────────────────────────────┘ │        │
│                              │ Softmax                       │        │
│                              ▼                               │        │
│     [ 6-Class Growth Stage Distribution (WGSP Taxonomy) ]    │        │
└──────────────────────────────┬───────────────────────────────┘        │
                               │                                        │
                               ▼                                        │
┌──────────────────────────────────────────────────────────────┐        │
│         Layer 4: Temporal & Decision Support Engine          │        │
│   • Temporal Growth Tracker (Field Timeline, Monotonic Rule) │        │
│   • Deterministic Agronomic Matrix (Nutrients, Water, Rust)  │        │
└──────────────────────────────┬───────────────────────────────┘        │
                               │ Verified Phenology & Advisory          │
                               ▼                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             Layer 5: Collective Geospatial & Agronomic Knowledge Repository            │
│   • PostGIS Spatial Store: Field Boundary Polygons (GeoJSON MultiPolygons)             │
│   • Crop History Store: Seed cultivar (Akbar-19, Dilkash-20), Sowing Date, Soil Type  │
│   • Input Ledger: Complete fertilizer schedule (DAP, Urea, SOP), Irrigation cycles     │
│   • Harvest Registry: Verified yield records, normalized to kg/m² and Maunds/Acre      │
│   • Privacy Shield: Anonymizes farmer PII while preserving transparent agronomic data  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             Layer 6: Peer Benchmarking & Best-Practice Showcase Engine                 │
│   • Calculates Normalized Yield Efficiency: (Total Grain kg) / (Field Area m²)         │
│   • Filters & Ranks Top Performing Fields by Agro-Ecological Zone / Soil Type          │
│   • Synthesizes "Agronomic Success Playbooks" (Exact input recipes of best fields)     │
│   • "Adopt Playbook" Feature: Auto-generates personalized schedule for peer farmers    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Hardware, Software & Runtime Environment

### Host System Specifications
* **Operating System:** Windows 11 Pro + WSL2 Ubuntu Linux (kernel: `5.15.x` / `6.x`)
* **Primary GPU:** NVIDIA GeForce RTX 5070
  * **Architecture:** Blackwell (`sm_120`)
  * **VRAM:** 12 GB GDDR7
  * **Compute Capability:** Confirmed functional with PyTorch CUDA 12.8
* **Conda Environment:** `FoMo4Wheat` (Python 3.11.16)
* **PyTorch Suite:** `PyTorch 2.11.0+cu128` (Hardware accelerated on `sm_120`)
* **Attention Kernel:** `xFormers 0.0.35` (Memory-efficient attention active)

### Critical Environment Gotchas & Permanent Fixes
1. **Module Name Discrepancy:** The official repository authors renamed the base directory to `FoMo4Wheat` but kept internal import references as `from dinov2.layers import ...`.  
   * **Fix:** A symlink was created in the workspace root: `dinov2 -> FoMo4Wheat`. Do not delete this symlink.
2. **PyTorch 2.6+ `torch.load` Default Change:** Modern PyTorch defaults to `weights_only=True`, which fails when loading custom pickled classes like `DinoVisionTransformer`.  
   * **Fix:** In inference and evaluation scripts, pass `weights_only=False` or load state dictionaries explicitly.
3. **VRAM Safety:** The ViT-B/14 backbone requires < 400 MB VRAM in half-precision (`fp16`) during inference. Training the frozen linear probe head takes < 2 GB VRAM, fitting safely inside the 12 GB envelope.

---

## 5. Foundation Model Architecture: FoMo4Wheat

### Origin & Pre-Training Details
* **Paper:** *"FoMo4Wheat: Toward reliable crop vision foundation models with globally curated data"* (Liu et al., 2025).
* **Pre-training Dataset (*ImAg4Wheat*):** 2.5 million high-resolution RGB wheat canopy images spanning 2,000+ genotypes, 500 environmental conditions, 30 sites across 10 countries, collected over 10 years across complete crop cycles.
* **Pre-training Objective:** Self-supervised learning via **DINOv2** (discriminative self-distillation with masked image modeling).

### Model Configuration (ViT-B/14)
* **Architecture:** Vision Transformer Base (ViT-B)
* **Patch Size:** $14 \times 14$ pixels
* **Total Parameters:** $86,590,464$ (~86.6M params)
* **Transformer Layers:** 12 nested Transformer blocks
* **Attention Heads:** 12 attention heads (head dimension = 64)
* **Embedding Dimension:** $D = 768$
* **Weights Checkpoint:** `weight/FoMo4Wheat_base.pth` (330.43 MB)

### Crucial Distinction
> **FoMo4Wheat is an encoder/feature extractor, NOT a ready-made 6-class classifier.**  
> Passing an image through the backbone yields a 768-D CLS token and 1369 spatial patch tokens (for $518 \times 518$ input). It does NOT output class probabilities out of the box.

---

## 6. Downstream Growth Stage Classification (WGSP)

### The 6-Class Biological Phenology Taxonomy
NextGenYeild strictly adopts the six biologically critical growth stages of wheat established in agricultural science and the official WGSP benchmark:

| Index | Label Folder | Stage Name | Visual Phenotype & Agronomic Definition |
| :---: | :--- | :--- | :--- |
| **0** | `0_tillering` | **Tillering** | Production of secondary lateral shoots from the crown. Ground-covering green canopy; stem elongation has not begun. |
| **1** | `1_jointing` | **Jointing (Stem Elongation)** | Rapid vertical stem elongation. Palpable internodes/nodes visible above the soil surface. |
| **2** | `2_booting` | **Booting** | Swollen flag leaf sheath completely enclosing the developing ear/spike prior to emergence. |
| **3** | `3_anthesis` | **Anthesis (Flowering)** | Full ear emergence; visible extrusion of delicate yellow/cream anthers for pollination. |
| **4** | `4_grain_filling` | **Grain Filling** | Grains develop through watery, milk, and soft dough stages. Ears and canopy remain primarily green/yellowish green. |
| **5** | `5_maturity` | **Maturity (Senescence)** | Desiccation and ripening. Complete loss of chlorophyll; crop canopy and spikes turn dry golden-brown. Ready for harvest. |

*Rule:* We do not mix weeds, diseases, pests, or nutrient deficiencies into this 6-class stage classifier.

### Classification Head Architecture (Linear Probing)
To preserve the 2.5-million-image visual priors and avoid catastrophic forgetting:
1. **Backbone State:** Frozen (`param.requires_grad = False` for all 86.6M parameters).
2. **Feature Pooling:** Concatenation of the global `[CLS]` token (768-D) with the average-pooled spatial patch tokens (768-D), yielding a 1536-D dense vector $\mathbf{x}$.
3. **Linear Layer:**
   $$\mathbf{z} = \mathbf{W}\mathbf{x} + \mathbf{b} \quad \text{where } \mathbf{W} \in \mathbb{R}^{6 \times 1536}, \; \mathbf{b} \in \mathbb{R}^6$$
4. **Optimization:** Cross-Entropy Loss with AdamW optimizer, cosine learning rate schedule, trained for 10–20 epochs (runs in ~2 minutes on the RTX 5070).
5. **Head Checkpoint Target:** `weight/nextgenyeild_wgsp_head_v1.pth`.

---

## 7. Dataset Architecture & Ingestion Standards

### Local Directory Organization
```
data/
├── README.md               # Complete documentation of taxonomy & collection criteria
├── .gitignore              # Excludes image binaries from Git
├── raw/                    # Original uncurated archives & raw image collections
├── processed/              # Cleaned, deduplicated, and resized images
├── train/                  # Training set (70% split across 6 stage subfolders)
├── validation/             # Validation set (15% split across 6 stage subfolders)
├── test/                   # Held-out benchmark test set (15% split across 6 stage subfolders)
└── external/               # Local smartphone & Pakistani field trials
```

### Dataset Sources & Provenance
1. **Benchmark Set (WGSP Dataset):**
   * *Reference:* Shen et al., *Plant Phenomics*, 2024.
   * 3,353 canopy images across 263 varieties collected in multi-year field trials in the UK, China, and the USA.
2. **WGSP-Smartphone-Data (`data/external/`):**
   * Official handheld smartphone dataset (2.51 GB) spanning all 6 growth stages under diverse angles and shadows.
3. **Pakistani Field Realism Dataset (Kaggle Peshawar):**
   * *Reference:* Sarfaraz Khan et al. (`sarfarazkhanmphil/wheat-weed-field-image-dataset`).
   * 2,074 high-resolution field images from Khyber Pakhtunkhwa, Pakistan. Essential for validating model performance against local Pakistani soil color, weed density, and natural field conditions.

### Image Capture & Preprocessing Standards
* **Color Space:** 3-channel RGB.
* **Resolution:** Minimum $224 \times 224$ pixels; recommended $\ge 518 \times 518$ pixels.
* **View Angle:** Oblique to top-down ($45^\circ \text{ to } 90^\circ$ relative to horizontal).
* **Transforms:** Resize to 518, bicubic interpolation, center crop, normalize with ImageNet mean `[0.485, 0.456, 0.406]` and std `[0.229, 0.224, 0.225]`.

---

## 8. Temporal Crop Growth Monitoring (The Timeline Engine)

A single prediction ("Current Stage: Booting") does not reflect how crops develop. NextGenYeild introduces a **temporal observation engine** to build a continuous growth history for each field.

### Observation Data Model
Each field observation record contains:
```json
{
  "observation_id": "obs_9f8c2b71",
  "field_id": "field_punjab_north_04",
  "farmer_id": "usr_4401",
  "timestamp": "2026-10-15T09:30:00Z",
  "image_url": "s3://nextgenyield-media/obs_9f8c2b71.jpg",
  "predicted_stage_index": 2,
  "predicted_stage_name": "booting",
  "confidence": 0.942,
  "class_probabilities": {
    "tillering": 0.001,
    "jointing": 0.045,
    "booting": 0.942,
    "anthesis": 0.011,
    "grain_filling": 0.001,
    "maturity": 0.000
  },
  "model_version": "fomo4wheat-wgsp-v1"
}
```

### Timeline Tracking & Sanity Rules
* **Natural Monotonic Sequence:** $0 \to 1 \to 2 \to 3 \to 4 \to 5$.
* **Backward Transition Warning:** If an observation drops from *Booting* to *Tillering*, the system flags an anomaly (e.g. camera pointed at understory weeds or user error) rather than silently updating state.
* **Biological Stalls:** If a crop remains in *Booting* for longer than biologically expected given accumulated thermal time (Growing Degree Days), the system alerts the farmer to inspect for stunted growth or drought stress.

---

## 9. Rule-Based Agronomic Decision Support Engine

### Core Philosophy
> **No LLM Hallucinations:** Agricultural recommendations are derived strictly from deterministic agronomic knowledge bases and validated extension service guidelines. Generative LLMs are never permitted to invent fertilizer doses, fungicide chemicals, or watering intervals.

### Stage-Specific Agronomic Matrix

| Detected Stage | Primary Objective | Water & Irrigation Rules | Nutrient & Fertilizer Rules | Crop Protection & Hazard Prevention |
| :--- | :--- | :--- | :--- | :--- |
| **0: Tillering** | Root system establishment & tiller development | Moderate irrigation (Crown Root Initiation - CRI stage is critical, 20–25 days after sowing). | Apply first split of Nitrogen (Top dressing, e.g. Urea). Ensure balanced Phosphorus at root level. | High vulnerability to broadleaf and grassy weeds. Apply selective post-emergence herbicide if weed threshold exceeded. |
| **1: Jointing** | Rapid stem elongation & spikelet formation | High water demand. Maintain optimal soil moisture to prevent internode shortening. | Apply second split of Nitrogen fertilizer before flag leaf emerges. Avoid excessive nitrogen to prevent lodging. | Scout for early signs of yellow/stripe rust on lower leaves. Monitor stem borer activity. |
| **2: Booting** | Head development inside flag leaf sheath | **Critical moisture window.** Water stress during booting irreversibly reduces potential spikelet count. | Foliar Micronutrient spray (Zinc, Boron) if deficiency symptoms exist. No heavy granular N. | Highest vulnerability to flag leaf rust and powdery mildew. Protect flag leaf (contributes > 50% grain fill). |
| **3: Anthesis** | Flowering & Pollination | Maintain adequate soil moisture. Avoid heavy sprinkler irrigation during peak flowering to protect pollen. | No further nitrogen application needed. | Monitor for Head Blight (Fusarium) if humid/rainy. Extreme sensitivity to heat stress (> $32^\circ\text{C}$ causes floret sterility). |
| **4: Grain Filling** | Starch and protein deposition in kernels | Final irrigation (milky stage). Avoid late irrigation near soft dough to prevent root lodging in high winds. | No granular fertilizer. Optional foliar potassium spray if terminal drought threatens. | Protect against aphids and late leaf blight. Guard against late-season terminal heat waves. |
| **5: Maturity** | Desiccation & harvest readiness | **Cease all irrigation completely.** Field must dry to allow combine harvester access. | Strictly zero application. | Monitor grain moisture percentage (target: 12%–14% for storage). Harvest promptly to prevent shattering or rain-induced sprouting. |

---

## 10. Image Quality & Angle Compliance Engine (Pre-Inference Edge Guardrail)

### The Field Photography Problem
Handheld smartphone photography in agricultural environments presents severe challenges:
1. **Motion Blur & Wind Flutter:** Farmers holding phones with one hand while plants sway in wind produce severe high-frequency attenuation and motion blur.
2. **Improper View Angle:** Pointing the camera horizontally captures weeds, soil, or background horizons rather than the wheat canopy. Top-down or high-angle oblique photography ($45^\circ - 90^\circ$ relative to horizontal) is mandatory for reliable phenological feature extraction.
3. **Lighting Extremes:** Overexposure from harsh midday sun or deep shadows during dawn/dusk distort chlorophyll reflectance signatures.
4. **Bandwidth & Compute Waste:** Submitting invalid or blurry photos to the GPU backend foundation model wastes network bandwidth, server VRAM, and yields untrustworthy predictions.

### Two-Tier Quality Assurance Pipeline

```
[ Raw Camera Feed / Shutter Tap ]
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│  Tier 1: On-Device Real-Time Edge Filter (Client-Side, 0ms) │
│  • Blur Detection: Variance of Laplacian (σ²_blur ≥ 100)    │
│  • IMU Sensor Fusion: Accelerometer Pitch Angle (45°–85°)   │
│  • Exposure Check: Luminance Histogram (15% ≤ Mean ≤ 85%)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
               [ PASS: Image Meets Quality Metrics ]
                               │ (If FAIL: Instant Viewfinder Warning)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Tier 2: Visual Canopy & Angle Classifier (Edge/Pre-Filter) │
│  • Lightweight Model: MobileNetV4 / EfficientNet-Lite       │
│  • Classes: [Valid Canopy (45°-90°), Horizontal/Side-View,  │
│              Soil/Weed-Dominated, Non-Agricultural Scene]   │
│  • Confidence Threshold: P(Valid Canopy) ≥ 0.85             │
└──────────────────────────────┬──────────────────────────────┘
                               │
               [ Verified Compliant Image ]
                               │
                               ▼
      [ Forward to FoMo4Wheat ViT-B/14 Backbone ]
```

### Detailed Mathematical Formulations

#### 1. Real-Time Blur Detection (Modified Laplacian Variance)
Convert RGB frame to grayscale $I(x, y)$. Convolve with standard discrete 2D Laplacian kernel:
$$L(x, y) = \nabla^2 I = \begin{bmatrix} 0 & 1 & 0 \\ 1 & -4 & 1 \\ 0 & 1 & 0 \end{bmatrix} * I(x, y)$$
Compute the spatial variance:
$$\sigma^2_L = \frac{1}{W \times H} \sum_{x=1}^{W} \sum_{y=1}^{H} (L(x, y) - \mu_L)^2$$
* **Compliance Threshold:** $\sigma^2_L \ge 100.0$.
* If $\sigma^2_L < 100.0$, the mobile app rejects the capture immediately and displays: *"Camera motion detected. Hold phone steady."*

#### 2. Device Sensor Fusion for Camera Angle
Using the mobile device's onboard Inertial Measurement Unit (IMU) accelerometer and gyroscope:
$$\theta_{\text{pitch}} = \arctan2\left(a_y, \sqrt{a_x^2 + a_z^2}\right) \times \frac{180^\circ}{\pi}$$
* **Acceptable Pitch Range:** $45^\circ \le \theta_{\text{pitch}} \le 85^\circ$ (downward oblique to nadir).
* The viewfinder displays an augmented horizon indicator / bubble level that turns green when within the compliant zone.

#### 3. Lightweight Canopy & Scene Gatekeeper
* **Model:** MobileNetV4-Small (quantized to INT8 for on-device execution or sub-15ms server pre-filter).
* **Training Objective:** Reject non-canopy scenes, extreme side-views, and weed carpets.
* **Loss:** Focal Loss to address class imbalance between valid wheat canopies and non-wheat field elements.

---

## 11. Collective Farm Intelligence & Geospatial Field Mapping

### Vision: The Shared Agricultural Knowledge Graph
Traditional smallholder agriculture suffers from isolated decision-making. NextGenYeild introduces **Collective Farm Intelligence**, transforming fragmented plots into a collaborative, geospatially anchored agricultural knowledge network. Farmers can explore neighboring fields on an interactive map, view historical field performance, compare agronomic inputs, and adopt proven strategies.

### Geospatial Architecture & Data Model

```
┌─────────────────────────────────────────────────────────────┐
│                 PostGIS Spatial Database                    │
│   • Field Boundary Geometry: ST_Polygon (SRID: 4326)        │
│   • Spatial Index: R-Tree GIST for sub-10ms bounding box    │
│   • Area Calculation: ST_Area(geography) in m² & Acres      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Comprehensive Field Profile                  │
│   • Identity: Anonymous Field ID (e.g. PK-FSD-048)          │
│   • Geography: Coordinates, Soil Texture, District/Tehsil   │
│   • Crop Lineage: Sowing Date, Seed Cultivar (Variant)      │
│   • Current State: Verified FoMo4Wheat Growth Stage         │
│   • Input Ledger: Fertilizer split dosages, Irrigation logs │
│   • Harvest Yield: Total grain (kg), Yield per m², Maunds   │
└─────────────────────────────────────────────────────────────┘
```

### Interactive Map Experience
1. **Dynamic Field Highlighting:** Fields are rendered as vector polygon overlays on satellite/hybrid imagery.
2. **Phenological Color Coding:** Field polygons are dynamically shaded according to their current verified growth stage:
   * **Tillering:** Vibrant Emerald (`#10B981`)
   * **Jointing:** Electric Cyan (`#06B6D4`)
   * **Booting:** Royal Purple (`#8B5CF6`)
   * **Anthesis:** Sunny Gold (`#F59E0B`)
   * **Grain Filling:** Warm Amber (`#D97706`)
   * **Maturity:** Golden Harvest Brown (`#B45309`)
3. **Interactive Field Inspector (Click-to-Inspect):**
   Tapping any highlighted field brings up its complete agronomic record:
   * **Wheat Variant / Cultivar:** Specific seed variety utilized (e.g., *Akbar-2019*, *Dilkash-2020*, *Faisalabad-2008*, *Zincol-2016*, *Ghazi-2019*, *Subhani-2021*), including cultivar traits (rust resistance, heat tolerance).
   * **Harvest Yield History:** Verified grain return per square meter ($\text{kg/m}^2$) and total yield in Maunds per Acre.
   * **Nutrient & Fertilizer Ledger:** Full split schedule:
     * Basal DAP & Potash application at sowing.
     * 1st Urea top-dressing + Zinc Sulfate at Tillering/CRI.
     * 2nd Urea top-dressing at Jointing.
     * Foliar micronutrient sprays (Boron, Zinc) during Booting.
   * **Irrigation Timeline:** Water sources (Canal water vs. Tube well groundwater), schedule, and critical stage watering dates.
   * **Crop Protection Log:** Fungicide applications for stripe/yellow rust and selective weed control.
   * **Visual Growth Timeline:** Sequential photo gallery documenting the field's progression across all 6 stages.

### Privacy, Anonymity & Data Sovereignty
* **Opt-In Sharing:** Farmers explicitly choose whether their field profile is visible to the regional community.
* **PII Redaction:** Farmer names, contact numbers, CNIC/ID, and residential coordinates are strictly stripped.
* **Fuzzy Geolocation Offset:** Exact homestead and private farm building locations are masked; only field agricultural boundaries are shared.
* **Pseudonymous Identifiers:** Fields are identified by anonymized registry keys (e.g., `Field #PK-FSD-048 (Akbar-19 · 4.5 Acres)`).

---

## 12. Peer Field Benchmarking & Best-Practice Showcase (Yield Return / m²)

### De-Gamification & Educational Philosophy
> **Explicit Design Principle: NOT a "Leaderboard"**  
> Competitive leaderboards in consumer apps foster toxic bragging, gamified cheating, and farmer alienation. NextGenYeild deliberately rejects gamified vanity metrics.  
> Instead, this feature is framed as the **"Regional High-Yield Best-Practice Showcase"** or **"Peer Agronomic Benchmarking Hub"**. The sole objective is **peer-to-peer knowledge transfer**: democratizing the verified techniques of top-performing farms so every farmer in the region can elevate their productivity.

### Core Standardized Metric: Yield Return per Square Meter ($\text{kg/m}^2$)
To ensure fair comparison across smallholdings (e.g., 1–2 acres) and commercial estates (e.g., 50+ acres), productivity is normalized per unit area:

$$\text{Yield Efficiency } (\eta_{\text{yield}}) = \frac{\text{Total Harvested Clean Grain (kg)}}{\text{Total Measured Field Surface Area } (m^2)}$$

#### Metric Conversion & Agronomic Reference Benchmarks

| Yield ($\text{kg/m}^2$) | Equivalent (Metric Tons / Hectare) | Equivalent (Maunds / Acre) | Agronomic Classification |
| :---: | :---: | :---: | :--- |
| **$< 0.25$** | $< 2.5 \text{ t/ha}$ | $< 25 \text{ mds/acre}$ | Below Average (Severe nutrient or water stress) |
| **$0.25 - 0.40$** | $2.5 - 4.0 \text{ t/ha}$ | $25 - 40 \text{ mds/acre}$ | Regional Average (Conventional smallholder baseline) |
| **$0.40 - 0.55$** | $4.0 - 5.5 \text{ t/ha}$ | $40 - 55 \text{ mds/acre}$ | Good Progressive Farm (Balanced fertilizer & timely irrigation) |
| **$0.55 - 0.70$** | $5.5 - 7.0 \text{ t/ha}$ | $55 - 70 \text{ mds/acre}$ | High-Yield Benchmark (Optimized cultivar + precision timing) |
| **$> 0.70$** | $> 7.0 \text{ t/ha}$ | $> 70 \text{ mds/acre}$ | Top Regional Showcase (Requires harvest verification audit) |

*Conversion note:* $1 \text{ Maund} = 40 \text{ kg}$; $1 \text{ Acre} = 4,046.86 \text{ m}^2$; $1 \text{ Hectare} = 10,000 \text{ m}^2$.

### The "Agronomic Success Playbook"
When a field achieves top-tier yield efficiency within an agro-ecological zone, the system compiles an interactive **Success Playbook**:
1. **Variety & Seed Rate:** Cultivar selected (e.g., *Akbar-19*), certified seed class, and seeding density ($120 \text{ kg/ha}$).
2. **Sowing Date Window:** Optimal planting date relative to local winter temperature drop.
3. **Stage-Synchronized Nutrient Protocol:** The exact doses applied at each FoMo4Wheat-verified stage (e.g., DAP at sowing, Urea split #1 at verified Tillering, Urea split #2 at verified Jointing).
4. **Moisture Management:** Number and timing of irrigations, specifically avoiding water stress during Booting and Anthesis.

### "Adopt This Management Plan" (One-Tap Technique Transfer)
Any farmer viewing a top-performing field's playbook can tap **"Adopt This Plan"**. The app automatically:
* Scales the fertilizer dosages to their own field acreage.
* Synchronizes the scheduled interventions to their own field's sowing date and detected growth stage transitions.
* Sets proactive calendar and stage-triggered notifications for irrigation and top-dressing.

### Verification Tiers & Anti-Fraud Guardrails
To prevent falsification of yields:
* **Tier 1 (Self-Reported):** Displayed with an open badge; eligible for general peer review.
* **Tier 2 (Harvest Verified):** Backed by digital scale slips, weighbridge receipts, or geolocated combine harvester logs.
* **Anomaly Flagging:** Any yield report exceeding $8.5 \text{ t/ha}$ ($0.85 \text{ kg/m}^2$) is automatically flagged for agronomic review before appearing in regional showcases.

---

## 13. System Integration, REST API & Data Schemas

### API Boundary Architecture
The mobile application communicates exclusively through standard REST endpoints. PyTorch, CUDA, and model architectures are completely encapsulated behind the API.

#### 1. Image Quality & Angle Check Endpoint
* **Route:** `POST /api/v1/ai/quality-check`
* **Content-Type:** `multipart/form-data`
* **Request:** `image` (binary file), `pitch_angle` (float, optional from device sensor)
* **Response:**
```json
{
  "status": "success",
  "passed": true,
  "metrics": {
    "blur_score": 142.8,
    "blur_threshold": 100.0,
    "is_sharp": true,
    "angle_pitch": 68.4,
    "is_angle_valid": true,
    "scene_class": "wheat_canopy_oblique",
    "scene_confidence": 0.961
  },
  "feedback": "Image quality is excellent. Ready for stage classification."
}
```

#### 2. Growth Stage Prediction Endpoint
* **Route:** `POST /api/v1/ai/growth-stage/predict`
* **Content-Type:** `multipart/form-data`
* **Request Body:**
  * `image`: Binary image file (`.jpg`, `.png`)
  * `field_id`: String (UUID)
  * `crop_type`: `wheat` (default)
* **Response Payload (`200 OK`):**
```json
{
  "status": "success",
  "data": {
    "stage_index": 2,
    "stage_name": "booting",
    "confidence": 0.942,
    "confidence_rating": "high",
    "probabilities": {
      "tillering": 0.001,
      "jointing": 0.045,
      "booting": 0.942,
      "anthesis": 0.011,
      "grain_filling": 0.001,
      "maturity": 0.000
    },
    "model_metadata": {
      "backbone": "FoMo4Wheat_base (ViT-B/14)",
      "classifier_head": "nextgenyeild_wgsp_head_v1",
      "version": "fomo4wheat-wgsp-v1"
    },
    "advisory": {
      "summary": "Crop is in Booting stage. Head is swelling within the flag leaf sheath.",
      "irrigation_guidance": "Critical water window: Maintain soil moisture to preserve spikelet count.",
      "nutrient_guidance": "Avoid heavy granular nitrogen; inspect flag leaf health.",
      "risk_alerts": ["Monitor flag leaf for early stripe rust pustules."]
    }
  }
}
```

#### 3. Geospatial Fields Map & Bounding Box Endpoint
* **Route:** `GET /api/v1/geospatial/fields/map?bbox=73.0,31.3,73.2,31.5`
* **Response (`200 OK` - GeoJSON FeatureCollection):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "field_punjab_north_04",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.05, 31.35], [73.06, 31.35], [73.06, 31.36], [73.05, 31.36], [73.05, 31.35]]]
      },
      "properties": {
        "field_id": "field_punjab_north_04",
        "display_name": "Field #PK-FSD-04",
        "area_sq_meters": 16187.4,
        "area_acres": 4.0,
        "current_stage": "booting",
        "stage_index": 2,
        "wheat_variant": "Akbar-2019",
        "sowing_date": "2026-11-12",
        "soil_type": "sandy_loam",
        "latest_yield_kg_per_sqm": 0.62,
        "is_top_performer": true
      }
    }
  ]
}
```

#### 4. Field Detailed Agronomic Profile Endpoint
* **Route:** `GET /api/v1/geospatial/fields/{field_id}/profile`
* **Response Payload (`200 OK`):**
```json
{
  "field_id": "field_punjab_north_04",
  "metadata": {
    "district": "Faisalabad",
    "soil_texture": "Sandy Loam",
    "area_m2": 16187.4,
    "area_acres": 4.0,
    "wheat_variety": "Akbar-2019",
    "sowing_date": "2026-11-12",
    "sowing_method": "Drill sowing"
  },
  "current_phenology": {
    "detected_stage": "booting",
    "stage_index": 2,
    "last_updated": "2026-10-15T09:30:00Z",
    "stage_color_hex": "#8B5CF6"
  },
  "historical_inputs": {
    "fertilizer_regimen": [
      {"stage": "Sowing (Basal)", "type": "DAP", "dose_per_acre": "1.5 bags", "date": "2026-11-12"},
      {"stage": "Tillering (1st Split)", "type": "Urea + Zinc", "dose_per_acre": "1 bag Urea + 5kg Zinc", "date": "2026-12-05"},
      {"stage": "Jointing (2nd Split)", "type": "Urea", "dose_per_acre": "1 bag Urea", "date": "2027-01-08"}
    ],
    "irrigation_records": [
      {"event": "Rouni (Pre-sowing)", "source": "Canal", "date": "2026-11-05"},
      {"event": "1st Irrigation (CRI)", "source": "Canal", "date": "2026-12-06"},
      {"event": "2nd Irrigation (Jointing)", "source": "Tube well", "date": "2027-01-10"}
    ]
  },
  "harvest_records": {
    "season": "Rabi 2025-2026",
    "total_grain_kg": 10036.0,
    "yield_kg_per_sqm": 0.62,
    "yield_maunds_per_acre": 62.0,
    "verification_status": "harvest_verified"
  }
}
```

#### 5. Best-Practice Showcase & Peer Benchmarks Endpoint
* **Route:** `GET /api/v1/benchmarking/showcase?district=Faisalabad&sort_by=yield_per_sqm`
* **Response Payload (`200 OK`):**
```json
{
  "region": "Faisalabad District",
  "benchmark_metric": "yield_kg_per_sqm",
  "top_performing_fields": [
    {
      "rank": 1,
      "field_id": "field_punjab_north_04",
      "wheat_variant": "Akbar-2019",
      "yield_kg_per_sqm": 0.62,
      "yield_maunds_per_acre": 62.0,
      "soil_type": "sandy_loam",
      "key_success_factors": [
        "Sown in optimal window (Nov 12)",
        "Applied Zinc sulfate with 1st irrigation at tillering",
        "Zero water stress maintained during booting phase"
      ],
      "playbook_available": true
    }
  ]
}
```

### Model Versioning Protocol
* Every prediction record stores the exact model version that produced it (`model_version`).
* **Initial Release:** `fomo4wheat-wgsp-v1` (Frozen FoMo4Wheat ViT-B/14 + Linear Probe on WGSP benchmark).
* **Fine-Tuned / Adapted Release:** `nextgenyeild-wheat-stage-v2` (if domain adaptation is performed on local Pakistani smartphone data).
* **Rule:** Never overwrite checkpoints in place; maintain unique file names in `weight/`.

---

## 14. Farmer Mobile Application UX & Interactive Interfaces

### Viewport & Screen Architectures

#### 1. In-Camera Quality HUD Viewfinder
* **Live Artificial Horizon Reticle:** Real-time level line powered by smartphone gyroscope. Turns bright green when pitch angle is between $45^\circ$ and $85^\circ$.
* **Motion & Sharpness Badge:** Live text badge: "Steady · Ready to Capture" (Green) vs "Camera Moving · Hold Still" (Amber).
* **Capture Guidelines Overlay:** Dashed rectangular box indicating the target canopy zone, reminding farmers to step within 0.5–1.0 meter of wheat canopy.

#### 2. Interactive GIS Farm Map Screen
* **Vector Map Display:** High-resolution map with GPS centering on the farmer's current location.
* **Field Boundary Polygons:** Surrounding farm fields highlighted with color-coded stage fills.
* **Filter Bar:** Toggle layers: "All Fields", "My Fields", "Top Yield Fields", or filter by Growth Stage.
* **Quick-Peek Card:** Tapping a field opens a bottom modal displaying the field code, seed variant, current stage badge, and yield/m².

#### 3. Field Detail & Agronomic History Drawer
* **Visual Phenology Timeline:** Horizontal progress bar showing stages 0 to 5, with dates of transitions.
* **Input Recipe Accordion:** Expandable sections detailing fertilizer types, dates, and dosages.
* **Harvest Outcome Card:** Clean display of grain yield return per $m^2$ and Maunds/acre.

#### 4. Regional Best-Practice Showcase (The Non-Leaderboard Hub)
* **Design Tone:** Collaborative, supportive, and informative. Uses headline: *"Top Performing Fields in Your Region — Learn Their Techniques"*.
* **Filter Chips:** By Wheat Variety (*Akbar-19*, *Dilkash-20*), By Soil (*Sandy Loam*, *Clay*), By Irrigation Type.
* **Playbook Viewer:** Tap any top field to inspect their exact input calendar.
* **"Adopt This Plan" CTA Button:** Converts the top field's schedule into a personalized management plan for the user's field.

---

## 15. Project Scope Boundaries (Refined & Clarified)

To guarantee successful completion and academic rigor of the undergraduate FYP, clear scope boundaries are strictly maintained.

### Scope Matrix: What IS vs What is NOT in Scope

| Feature Area | Strictly IN Scope (Built & Validated) | Explicitly OUT of Scope (Not Overbuilt) |
| :--- | :--- | :--- |
| **Image Quality & Angle** | Edge Laplacian blur filter + smartphone IMU tilt guidance + lightweight canopy classifier | Full real-time 3D NeRF canopy reconstruction or hyperspectral angle calibration |
| **Phenological AI** | Frozen FoMo4Wheat ViT-B/14 + Linear Probe for 6 WGSP growth stages | Automated direct yield prediction purely from raw pixels (statistically invalid without multi-spectral/satellite data) |
| **Field Mapping & GIS** | GeoJSON polygon boundaries, PostGIS spatial indexing, interactive map with stage colors | Autonomous drone boundary flight planning or automated tractor auto-steer |
| **Agronomic Data** | Collective field history store (wheat variant, fertilizer ledger, irrigation, verified harvest yield) | Autonomous robotic pesticide sprayers or in-ground IoT moisture telemetry mesh |
| **Peer Benchmarking** | Normalized yield per $m^2$ calculation, high-yield showcase, and technique playbook cloning | Gamified competitive public leaderboards, wagering, or ungrounded generative LLM advice |

### The Unified System Equation
$$\mathbf{Field \; Image} \xrightarrow{\text{Quality Gate}} \mathbf{Growth\text{-}Stage} \xrightarrow{\text{Timeline}} \mathbf{Decision \; Support} \longleftrightarrow \mathbf{Geospatial \; Map} \longleftrightarrow \mathbf{Peer \; Benchmarking}$$

---

## 16. 18-Phase Master Roadmap & Progress Tracker

| Phase # | Phase Title | Status | Completion Date | Key Output / Artifact |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Understand Existing FoMo4Wheat Repo** | **DONE** | 2026-09-28 | Documented ViT-B/14 architecture, SSL nature, and hub protocols. |
| **2** | **Verify Pretrained Model on Hardware** | **DONE** | 2026-09-28 | `experiments/fomo4wheat_verify.py` passed on RTX 5070. |
| **3** | **Understand Growth-Stage Task (WGSP)** | **DONE** | 2026-09-28 | Determined backbone must remain frozen; 6-class linear probe required. |
| **4** | **Create Local Dataset Structure** | **DONE** | 2026-09-28 | Created `data/` layout, `.gitignore`, and `data/README.md`. |
| **5** | **Build Real Experiment Pipeline** | ⏳ **IN PROGRESS** | *Target: Next* | Train/val loop, per-class metrics, confusion matrix, logging. |
| **6** | **Test on Realistic Images** | ⏸️ Queued | *Pending* | Evaluate on `WGSP-Smartphone-Data` and Kaggle Peshawar field images. |
| **7** | **Determine Fine-Tuning Need** | ⏸️ Queued | *Pending* | Compare frozen linear probe vs fine-tuning on local images. |
| **8** | **Temporal Growth Monitoring** | ⏸️ Queued | *Pending* | Implement observation schema, transition validator, and timeline API. |
| **9** | **Decision Support Engine** | ⏸️ Queued | *Pending* | Build deterministic agronomic rule-engine mapping stages to advice. |
| **10** | **Backend / API Service** | ⏸️ Queued | *Pending* | Build FastAPI service exposing stage prediction endpoints. |
| **11** | **Image Quality & Angle Compliance Engine** | ⏸️ Queued | *Pending* | Implement Laplacian blur check, IMU pitch validator, and canopy filter. |
| **12** | **Geospatial Field Mapping & GIS Storage** | ⏸️ Queued | *Pending* | PostGIS integration, GeoJSON field polygon storage, and map endpoints. |
| **13** | **Collective Field History & Input Ledger** | ⏸️ Queued | *Pending* | Data models for wheat varieties, fertilizer schedules, and harvest yield. |
| **14** | **Peer Benchmarking & Best-Practice Showcase** | ⏸️ Queued | *Pending* | Yield return per $m^2$ engine, top-performer showcase, and playbook cloner. |
| **15** | **NextGenYeild Mobile App UX** | ⏸️ Queued | *Pending* | Camera HUD, interactive map view, field profile drawer, and showcase UI. |
| **16** | **Model Versioning & Checkpoint Safety** | ⏸️ Queued | *Pending* | Establish checkpoint persistence (`fomo4wheat-wgsp-v1`). |
| **17** | **Comprehensive Documentation & Thesis** | ⏳ Active | *Ongoing* | Maintain Master Document, experiment logs, and LaTeX FYP report. |
| **18** | **Final System Integration & Field Trials** | ⏸️ Queued | *Pending* | End-to-end integration: Mobile App ↔ Backend ↔ AI Pipeline ↔ GIS Map. |

---

## 17. Historical Experiment Log & Benchmark Records

### Experiment #001: Pretrained Backbone Hardware Verification (Phase 2)
* **Date:** September 28, 2026
* **Objective:** Verify CUDA 12.8 execution of `FoMo4Wheat_base.pth` on NVIDIA GeForce RTX 5070 (Blackwell `sm_120`).
* **Runner:** [`experiments/fomo4wheat_verify.py`](file:///home/shawaiz/fyp/FoMo4Wheat/experiments/fomo4wheat_verify.py)
* **Input Tensor:** Synthetic RGB canopy image ($1 \times 3 \times 518 \times 518$) in `fp16`.
* **Outcomes:**
  * Global CLS Embedding Shape: `torch.Size([1, 768])`
  * Spatial Patch Tokens Shape: `torch.Size([1, 1369, 768])`
  * GPU VRAM Allocated: 191.99 MB (Peak Reserved: 384.00 MB)
  * Exit Status: `Code 0 (Success)`
* **Conclusion:** Foundation ViT-B/14 runs with near-zero latency and minimal memory overhead on local hardware. Ready for downstream linear probing.

---

## 18. Developer & AI Assistant Operational Cheat Sheet

### Golden Rules of Engagement
1. **Never Recreate the Environment:** The Conda environment `FoMo4Wheat` with PyTorch 2.11.0+cu128 is tested and operational on the RTX 5070.
2. **Never Fabricate Capabilities:** Never claim the model detects diseases, weeds, or raw-pixel yield unless an evaluated model exists.
3. **Keep the Backbone Frozen:** Do not perform full backpropagation through all 86M parameters unless Phase 7 specifically establishes empirical justification.
4. **Never Use Unconstrained LLMs for Agronomic Advice:** All recommendations must flow through the deterministic rule engine.
5. **Always Test Per-Class:** Do not report a single aggregated accuracy; always inspect per-class Precision, Recall, and Confusion Matrices across all six growth stages.
6. **De-Gamify Farm Benchmarks:** Never call the peer performance showcase a "Leaderboard" in user-facing contexts. Emphasize collaborative learning, yield return per square meter ($\text{kg/m}^2$), and actionable agronomic playbooks.
7. **Guard the Gatekeeper:** Always enforce image sharpness and camera angle compliance before dispatching images to foundation model inference.

