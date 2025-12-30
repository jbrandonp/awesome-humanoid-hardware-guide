# 🤖 The Open Source Humanoid Guide: From Signal to Behavior
### A Technical Survival Manual for Sim-to-Real Transfer

![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)
![License: MIT](https://img.shields.io/badge/Code%20License-MIT-blue.svg)
![Status](https://img.shields.io/badge/Status-Active%20Research-green)
![Topic](https://img.shields.io/badge/Topic-Sim2Real%20%7C%20Hardware%20%7C%20Control-orange)

> **"The simulation is willing, but the hardware is weak."**
> A deep technical analysis of the physical bottlenecks—Thermal, Latency, and EMI—that cause Open Source Humanoids to fail in the real world.

---

## 📥 Download the Full Report
**[📄 Click here to download the Unified Technical Reference Manual (PDF)](./Manuel_Architecture_Humanoïde_OpenSource.pdf)**

*(Includes: BOM Recommendations, Thermal Analysis, Control Loop Tuning, and Wiring Topologies)*

---

## 🧐 Why this repository?

Most research papers (Mobile ALOHA, RT-2) focus on the **Algorithm** (policy learning). They rarely discuss the **Infrastructure** required to run these policies on physical robots.

After months of debugging and analyzing failed Sim-to-Real transfers on low-cost hardware, I compiled this documentation to bridge the gap between "It works in Isaac Sim" and "It works on the floor."

### The "Bitter Lessons" of Hardware (Key Findings)
This repository documents the solutions to the 3 main silent killers of humanoid projects:

| Domain | The Trap | The Reality (Findings) |
| :--- | :--- | :--- |
| **🔥 Thermal**    | "Passive cooling is enough for walking." | **False.** QDD Actuators lose significant $K_t$ (torque) after 3 min of static balancing. **Active cooling is mandatory** to prevent thermal throttling and control divergence.  |
| **⚡ Signal**     | "Star topology is cleaner." | **Fatal.** On CAN-FD (5Mbps), star topology creates signal reflections. **Daisy Chain + 120Ω termination** is the only viable path to avoid "Ghost" errors. |
| **🧠 Compute**    | "Raspberry Pi 5 is fast enough." | **Nuanced.** The RPi 5 `RP1` chipset introduces a **12µs structural latency** on SPI. For Whole-Body Control (WBC) >1kHz, specific kernel isolation (`isolcpus`) is required.            |

---

## 📂 Repository Structure

This repository is organized into specific technical verticals. You can read the **Unified Manual** for a summary, or dive into specific reports:

* **`/01_Thermodynamics`** - Analysis of NdFeB magnet degradation and Active Cooling solutions.
* **`/02_Signal_Integrity`** - CAN-FD wiring guides, EMI shielding strategies, and grounding.
* **`/03_Real_Time_Compute`** - Raspberry Pi 5 kernel tuning, PCIe vs SPI analysis.
* **`/04_Control_Intelligence`** - From PID to Whole-Body Control (WBC) and Sim-to-Real Domain Randomization.
* **`/05_Strategy`** - BOM optimization and economic analysis (K-Scale Labs post-mortem).

---

## 🛠️ Usage & Citation

This work is intended for researchers, engineers, and students building:
* Open Dynamic Robot clones
* Mobile ALOHA replicas
* Custom QDD Quadipeds/Bipeds

### Citing this work
If you use these findings or the hardware guide in your research, please cite:

```bibtex
@techreport{HumanoidGuide2025,
  title={The Open Source Humanoid Architecture: From Signal to Behavior},
  author={[Brandon Louis]},
  year={2025},
  institution={ma piole},
  note={Sim-to-Real Hardware Reference Manual}
}
