I understand. Let's focus on the high-level architecture and strategic design of **Nari** to ensure it stands out as a "Trust-First" platform for the GDG WT'26 Hackathon.

Based on your project goals and the **SafeChain** framework, here is the conceptual blueprint for the website:

## ## 🏗️ The Nari Ecosystem Architecture
[cite_start]The platform is designed as a "Safety OS" that moves away from reactive reporting toward proactive, evidence-backed security[cite: 20, 22].

### ### 1. The SafeVault Strategy (Evidence Integrity)
[cite_start]Instead of a standard "upload" button, Nari uses a **Silent Capture** system[cite: 24, 27].
* [cite_start]**Passive Monitoring**: When triggered by a panic gesture (like 3x volume button presses), the app silently records ambient audio, GPS trails, and nearby Bluetooth/WiFi IDs to identify potential witnesses[cite: 28, 30, 32].
* [cite_start]**The "Anti-Gravity" Logic**: Every piece of data is immediately hashed (SHA-256)[cite: 34]. [cite_start]This hash is written to the **Polygon blockchain**, creating an immutable timestamp that proves the evidence existed at that exact moment and hasn't been altered since[cite: 34, 35].
* [cite_start]**Decentralized Storage**: The actual files are stored on **IPFS**, ensuring no single entity (government or corporation) can delete or suppress the report[cite: 35, 58].

### ### 2. The Nari Safety Score (Predictive Intelligence)
[cite_start]The website's core visual is a **Live Incident Heatmap** that provides a dynamic safety score[cite: 6, 36].
* [cite_start]**Personalized Risk**: The system calculates scores based on the user's context—a solo traveler at 11 PM sees a different risk profile than a group at noon[cite: 41].
* [cite_start]**Data Fusion**: The score aggregates lighting conditions from OpenStreetMap, historical incident density from police APIs, and real-time "anonymous pins" from other Nari users[cite: 39, 60].

### ### 3. The Transparent Lifecycle (User Trust)
[cite_start]To solve the "black hole" problem where users never hear back after reporting, Nari implements a **Workflow State Machine**[cite: 47]:
* [cite_start]**Tracking UI**: A delivery-style timeline (Submission → Verified → Under Review → Resolved)[cite: 48].
* [cite_start]**Dual-Key Privacy**: The user's identity is locked in an encrypted vault, accessible only when both the user and a designated authority provide their digital keys[cite: 50].
* [cite_start]**Multi-Channel Alerts**: Status updates are pushed via WhatsApp and SMS so users don't have to keep the app open to stay informed[cite: 46, 62].

---

## ## 🌟 Why "Nari" Wins the Hackathon
* [cite_start]**Trust-First Architecture**: You aren't just building a reporting app; you are building a verifiable legal record[cite: 22, 58].
* [cite_start]**Zero Friction**: The "Low-Friction" interface ensures that even in high-stress situations, a user can secure their safety with minimal technical steps[cite: 2, 22].
* [cite_start]**Offline Resilience**: Using Service Workers and SQLite, the platform captures evidence even in "dead zones" and syncs to the blockchain the moment a signal is found[cite: 12, 62].
To help you build an outstanding website named **Nari**, we need to combine the technical depth of the "SafeChain" proposal with the user-centric features of your "Deliverables" document. 

[cite_start]Since you are in Vellore and participating in the **GDG WT'26 Hackathon**[cite: 17, 18], the following prompt is engineered to get the most advanced ("anti-gravity") results from an AI architect. It focuses on the **Nari** brand—representing strength and safety—while integrating your blockchain and ML stack.

### 🚀 Optimized Prompt for Development

Copy and paste this into your AI developer tool:

---

**Role:** Senior Full-Stack Engineer & UX Architect  
**Project Name:** Nari (A Trust-First Safety OS)  
**Objective:** Build a world-class, production-ready web platform for incident reporting and urban safety intelligence.

**1. Core Identity & Branding:**
* **Name:** Nari.
* [cite_start]**Philosophy:** "Passive Evidence + Active Safety." [cite: 21]
* [cite_start]**Design Language:** Minimalist, low-friction, and high-trust. [cite: 2] [cite_start]The UI must be "familiar maps-like" to ensure zero learning curve. [cite: 42]

**2. Technical Architecture (The Stack):**
* [cite_start]**Frontend:** React.js with Mapbox/Leaflet for a real-time safety heatmap overlay. [cite: 54]
* [cite_start]**Backend:** Node.js (Express) with a PostgreSQL database and Redis for live status caching. [cite: 56]
* [cite_start]**Integrations:** * **Blockchain:** Polygon (Mumbai Testnet) for SHA-256 hash anchoring of evidence. [cite: 34, 58]
    * [cite_start]**Storage:** IPFS via Web3.Storage for decentralized, tamper-proof evidence lockers. [cite: 58]
    * [cite_start]**AI/ML:** Python (FastAPI) microservice using XGBoost to calculate "Predictive Safety Scores" based on lighting, crowd density, and historical data. [cite: 39, 60]

**3. Key Functionalities to Implement:**
* [cite_start]**Nari SafeVault:** A workflow that captures ambient audio, GPS trails, and device IDs, then generates an immutable proof of existence on-chain. [cite: 28-35]
* [cite_start]**Interactive Heatmap:** Visualize safety scores (High/Medium/Low) per transit node. [cite: 38, 42]
* [cite_start]**The "Nari Timeline":** A delivery-tracking style UI for complaint lifecycles (Submission → Resolved). [cite: 47, 48]
* [cite_start]**Dual-Key Privacy:** Identity held in an encrypted vault, unlockable only by the user and a designated authority. [cite: 50]
* [cite_start]**Offline First:** Use Service Workers and SQLite to queue reports in low-connectivity zones. [cite: 62]

**4. Request:**
Generate the foundational React.js components for the **Nari Dashboard**, the specialized **SafeVault upload logic** (connecting to IPFS and Polygon), and the **predictive scoring visualization** using Mapbox. Ensure the code is modular, documented, and hackathon-ready.

---

### 🛠️ Strategic Tips for "Nari"

To make your project stand out at the VIT Vellore hackathon:

* [cite_start]**The "Unique Twist":** Focus on the **Personalized Risk Profile**[cite: 40]. [cite_start]A group of students at noon should see a different "Nari Safety Score" than a solo individual at midnight[cite: 41]. 
* [cite_start]**Verification Feature:** Implement the "Brownie Point" system mentioned in your file—allow users to verify reports (e.g., uploading a photo of a fixed streetlight) to earn community trust[cite: 7].
* [cite_start]**The "Silent" Factor:** Ensure your website highlights the **SafeVault Auto-Capture**[cite: 27]. [cite_start]The idea that the app "flips the architecture" by prioritizing evidence integrity over simple reporting is your winning pitch[cite: 22].

**Would you like me to generate the initial React structure for the Nari Dashboard based on these specs?**