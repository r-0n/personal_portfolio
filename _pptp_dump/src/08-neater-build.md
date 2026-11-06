---
slug: neater-build
title: Transitioning to a Neater Build
date: 
heading: Transitioning to a Neater Build
url: https://app.notion.com/p/3827962f620780f0b833f87145519b3d
---
With an upgraded solenoid valves, it only made sense to create a neater circuit wiring: one that didn’t require any wiring connection on a breadboard because it would create a messy wiring connection. Messy wiring would consequently introduce unstable wiring (if the circuit needed to be moved or attached to something); make it difficult to make modifications without removing the wires for other solenoid valves, and many more drawbacks I found uncomfortable.

## **A. Bill of Materials (BOM) & Hardware Specifications**

#### Core Microcontroller & Power Strategy

- **Arduino Uno:** Acting as the main logic controller. Powered directly via its **DC barrel jack** connected to the 9V output of the TalentCell Rechargeable battery.
- **TalentCell Rechargeable Lithium-Ion Battery Pack (12V/9V):**
  - **9V DC Output:** Powers the Arduino board via barrel connector.
  - **12V DC High-Amperage Output (6A Max):** Powers the high-draw solenoid valves.

  *Note:* Utilizes dual power rails to isolate motor/solenoid noise from digital micro-logic.

#### Actuators & Switching Electronics Components

- **9× 12V DC Pneumatic Solenoid Valves:** 12V, pull approx. 200mA–300mA each during activation.
- **1× 8-Channel Relay Module:** **Active-Low** logic (operates on 5V logic from Arduino). Controls Valves 1 through 8.
- **1× Single Relay Module:** **Active-High** logic (operates on 5V logic from Arduino). Controls Valve 9.
- 9× Flyback Diodes (1N4001 or 1N4007): Protection against high-voltage inductive spikes produced when solenoid coils collapse.

*Note: If there is any confusion about the valves, here’s an explanation: I had access to an 8-channel relay module and had an extra one from a past project. Here is a video description of how they look, but more on how it was all wired later:*

@video[](images/pptp/neater-build/relay-modules-video_16-05-29.mp4)

#### Distribution & Connectors

- **Dual-Row Screw Terminal Block Strip (Barrier Strip) (Fig. 1):** Acts as a high-amperage Common Negative ground pool for all 12V valve circuits.

![Fig. 1](images/pptp/neater-build/fig1-terminal-block.png)

- **Jumper Wire Combs / Bus Links:** Used to daisy-chain terminals across one side of the barrier strip.
- **2.1mm DC Barrel Jack Adapters (Screw Terminal Style):** Breaks out the TalentCell 12V output to positive/negative bare wire leads.

# B. High-Voltage Power Distribution Wiring (12V System) ie

To easy visualization, here is a picture of the FULLY COMPLETE circuit wiring:

![](images/pptp/neater-build/complete-circuit-16-32-32.jpg)

- The red arrow points to the screw terminal blog. On one side (the black wires), is the daisy-chaine negative terminal.
- Below it is the the positive daisy-chain loop.

#### A. The Common Negative Bus (Screw Terminal Block / The ground)

To avoid cramming nine ground wires into a single power source connector, the Screw Terminal Block is configured as a **Negative Distribution Hub**:

1. All screw terminals along side A (opposite the valves in the image above) of the barrier strip are daisy-chained together using jumper wire bridges.
2. The **12V Negative (-) wire** from the TalentCell 12V output adapter is connected to any screw on the **daisy-chained side**. (for ease, I put it on the first screw on the far left.)
3. All negative legs from the 9 valves (and their flyback diodes) connect to individual slots on the same side as the daisy-chained ones, as I have done, or on the opposite side.

### B. The 12V Positive Daisy-Chain Loop

1. The **12V Positive (+) wire** from the TalentCell 12V output adapter connects to the **COM (Common)** terminal of **Relay 1**.
2. A short jumper wire bridges from **Relay 1 COM** to **Relay 2 COM**.
3. This jumper chain continues down all 8 COM terminals of the 8-channel module and finishes at the **COM** terminal of the 9th single relay module.

### C. Valve & Flyback Diode Terminal Connections

For each of the 9 valves, flyback diodes **must** be installed across the high-voltage termination points to prevent electromagnetic feedback from tripping the TalentCell battery's safety shutdown or resetting the Arduino:

- **Relay NO (Normally Open) Terminal:** Clamps **Valve Wire 1** twisted together with the ***Silver Stripe leg*** of the flyback diode.
- **Terminal Block Slot:** Clamps the V**alve Wire 2** twisted together with the ***Plain Black Leg*** of the flyback diode.

*Note: It is paramount you pay attention to how the wires are screwed into the terminal block and the channel relay module. I faced a long hardware debugging process because one wire was inserting a bit too deep in the terminal block so I had screwed the plastic protection instead. this obstructed the flow of electricity. I took a long time to debug.*

*Also pay attention to the silver-striped lef of the flyback diode and ensure they’re screwed in the right way*

# Programming

Critical Hardware Note: Valves 1–8 use an active-low module (relays click ON when receiving a LOW signal). Valve 9 uses an active-high module (clicks ON when receiving a HIGH signal). The firmware abstracts this completely so all patterns operate via standard ON/OFF state logic via key press.
