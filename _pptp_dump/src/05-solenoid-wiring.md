---
slug: solenoid-wiring
title: 03/06/2026 Wiring Up 3-way 2-Position Solenoid Valve
date: 03/06/2026
heading: Wiring Up 3-way 2-Position Solenoid Valve
url: https://app.notion.com/p/3767962f620780e88a4bc821cca372ad
---
In what follows I will give a full run down on what and why of solenoid valve used for the project Pneumitecture.

# Overview

The Airix 3V210-08 Pneumatic Solenoid Valve is designed for pneumatic and automation systems. It  offers reliable 2-position 3-way flow control. Ideal for regulating directional airflow in industrial applications with high repeatability. It comes with three pneumatic fittings:

1. 2 Male Straight Push to Connect Fittings
2. 1 Airtac BSL/pneumatic muffler.

The image below shows the dimensions from the Amazon link, but I found it to be misleading in case you’d want to get more fittings. In any case, you need more fittings for this valve. I found the fittings with thread 1/8” to be ideal instead of the 1/4’’ it says in the Amazon link and in this picture.

![](images/pptp/solenoid-wiring/dimensions-image.png)

This specific solenoid valve in the link comes with a junction box. However, there are some without it and has just wires for you to connect. Regardless, because we have the one with a junction box, I will document the process needed to wire it up and use it.

# Setting the Solenoid Valve Up

Before delving in, I found this link very helpful in helping understand the different types of solenoid valves and how to wire them.

1. First, take it out of its cardboard box.
2. There is a screw screwing the junction box to the valve body. Unscrew this.
3. Carefully remove the junction box and pass a live and earth wire through it like this:

![](images/pptp/solenoid-wiring/junction-box-wires.png)

4. Cut the ends of the wire and carefully connect them to the screw terminal on the connector that was inside the junction box:
   - NB: carefully screw them to avoid breaking/damagin the connector.

![](images/pptp/solenoid-wiring/terminal-12-36-08.jpg)
![](images/pptp/solenoid-wiring/terminal-12-36-18.jpg)

5. Put the connector back into the junction box and screw it tightly.

![](images/pptp/solenoid-wiring/connector-12-38-49.jpg)
![](images/pptp/solenoid-wiring/connector-12-39-12.jpg)

6. After that, you can then screw the pneumatic muffler/ Airtac BSL.

Link to purchase:

[https://www.amazon.ae/dp/B0FH79583S?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1](https://www.amazon.ae/dp/B0FH79583S?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1)

# Testing The Pneumatic Solenoid Valve With Arduino Control

After wiring and setting up the solenoid valve, it was now time to test it.

## Arduino Circuit Connection.

To achieve Arduino control with simple wiring, here are the things you’d need:

- **N-Channel MOSFET** (IRF520/TIP120 Transistor).
- **1N4007 Diode** (Crucial flyback diode to protect against voltage spikes).
- **10k Ohm Resistor** (Pull-down resistor).
- Breadboard and jumper wires.
- **12V External Power Supply** (for the valve).
- Arduino Uno.

*How I distribute 12V to the solenoid valve and share ground with the Arduino for simple testing*

1. **12V Positive:** Connected the **Positive (+)** wire of DC Power Supply (courtesy of IM Lab) to the **Red Rail** on the arduino breadboard.
2. **12V Ground:** Connected the **Negative (-)** wire of the DC Power Supply to the **Blue/Black Rail** on breadboard.
3. **Common Ground (CRITICAL):** Connected a jumper wire from the **Blue/Black Rail** to a **GND pin** on the Arduino. This was very CRITICAL because I learned if I mis*sed this wire, the Arduino wouldn’t talk to the motor driver or transistors.*

*How I used Arduino signals to switch the high-power 12V valves.*

**Wiring Steps for ONE Valve (Repeat as many time you need for more solenoid valves):**

1. **Place the Transistor:** Insert the TIP120 into the breadboard.
   - *Orientation:* Metal tab facing **away** from you.
   - *Pins (Right to Left):*  **Gate (G)**, **Drain (D)**, and **Source (S)**
2. **Source (Pin 3) to Ground:** Connect the Left** Leg** directly to the **Blue Ground Rail**.
3. **Gate (Pin 1) to Arduino:** Connect a **10kΩ Resistor** to the **Right Leg**. Connect the other end of the resistor to the specific **Arduino signal pin**.
4. **Drain (Pin 2) to Valve:** Connect the **Middle Leg** to **ONE wire** of the Solenoid Valve.
5. **Valve Power:** Connect the **OTHER wire** of your Solenoid Valve directly to the **Red 12V Rail**.
6. **The Diode (Safety):** Place the diode bridging the two valve wires (or between the Middle Leg and the 12V Rail).

*Notes*

- **Stripe (Cathode):** Must face the **Red 12V Rail**.
- **No-Stripe (Anode):** Must face the **Middle Leg (Drain)**.

# After Wiring

You should have something like the below.

![](images/pptp/solenoid-wiring/after-wiring-13-15-57.jpg)
@video[](images/pptp/solenoid-wiring/after-wiring-video_13-16-53.mp4)

Connect the Arduino to you laptop, open the Arduino Software application and paste this simplle code.

```cpp
// Define the pin connected to the MOSFET Gate
const int valvePin = 3; 

void setup() {
  // Initialize the pin as an output
  pinMode(valvePin, OUTPUT);
}

void loop() {
  digitalWrite(valvePin, HIGH); // Turn the valve ON (Opens/Shifts position)
  delay(2000);                  // Wait for 2 seconds
  
  digitalWrite(valvePin, LOW);  // Turn the valve OFF (Returns to default position)
  delay(2000);                  // Wait for 2 seconds
}
```

You should hear periodic clicking of the solenoid valve. That means it’s working.
