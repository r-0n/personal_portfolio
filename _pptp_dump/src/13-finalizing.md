---
slug: finalizing
title: More Testing & Finalizing
date: 
heading: More Testing & Finalizing
url: https://app.notion.com/p/3aa7962f620780ed8798cc1f985c7bca
---
On my next iteration of testing, I moved from controlling the solenoid valves by pressing a key to a more autonomous control. The code for this iteration takes into account a rest time phase after the battery is turned on, consequently turning on the system to allow for you to connect the air compressor to the system.

@video[](images/pptp/finalizing/final-testing2.mp4)

# The Firmware

The code also has 3 modes of patterns (random, sequence, and snake pattern) that it switches between after a full cycle of one mode.

- **At Startup:** The system defaults to autonomous mode. It will randomly pick between Random, Sequential, or Snake mode; run it for a full cycle (9 steps); hit a break; and then automatically pick a new random mode.
- **Keyboard Overrides:** If you type a command manually (`r`, `s`, or `n`), the autopilot instantly disengages, and it will loop your chosen pattern indefinitely.
- **Return to Auto:** You can press **`a`** at any time to turn the autopilot back on.

```cpp
//title: Pneumetecture valve control modes
//author: aaron wajah w/ help of Gemini
//date: 09/07/2026

// Define the 9 valve pins
const int valvePins[] = {2, 3, 4, 5, 6, 7, 8, 9, 10};

// Easy-to-read state aliases
#define ON 1
#define OFF 0

// ---- TIMING CONFIGURATION ----
const unsigned long startDelayTime = 5000;      // Rest period before action begins (5 seconds)
const unsigned long sequentialTotalTime = 7000; // Total time each valve runs (7 seconds)
const unsigned long overlapTime = 1000;         // How long two valves stay open together (1 second)

// ---- PATH ARRAYS (0-indexed mappings for pins 2 to 10) ----
const int sequentialOrder[] = {0, 1, 2, 3, 4, 5, 6, 7, 8}; // 1->2->3->4->5->6->7->8->9
const int snakeOrder[]      = {0, 1, 2, 5, 4, 3, 6, 7, 8}; // 1->2->3->6->5->4->7->8->9

// Track operational modes and states
enum SystemMode { IDLE, RANDOM_RUN, SEQUENTIAL_RUN, SNAKE_RUN };
SystemMode currentMode = IDLE;
SystemMode lastMode = IDLE;   // Memory buffer for the previous mode

bool isAutoMode = true;       // Defaults to true! System runs itself at startup.
bool firstRunOfMode = true;   // Triggers the 5-second rest phase on mode changes
int sequenceStep = 0;         // Tracks progression through path arrays
int randomStep = 0;           // Tracks how many random steps have executed

int currentValve = -1;        // Tracks active valve inside the loop
int lastValve = -1;           // Memory buffer for the absolute last deactivated valve

void setup() {
  Serial.begin(9600);

  // Initialize valve pins and ensure they start completely OFF
  for (int i = 0; i < 8; i++) {
    pinMode(valvePins[i], OUTPUT);
    digitalWrite(valvePins[i], HIGH); // HIGH keeps Active-Low (1-8) OFF
  }
  pinMode(valvePins[8], OUTPUT);
  digitalWrite(valvePins[8], LOW);    // LOW keeps Active-High (9) OFF
  
  randomSeed(analogRead(A0));
  
  Serial.println("=== Autonomous Valve System Initialized ===");
  Serial.println("System starting in AUTO-PILOT mode...");
  Serial.println("----------------------------------------");
  Serial.println("Keyboard Commands:");
  Serial.println("  'a' -> Re-engage AUTO-PILOT");
  Serial.println("  'r' -> Force Manual RANDOM Mode");
  Serial.println("  's' -> Force Manual SEQUENTIAL Mode");
  Serial.println("  'n' -> Force Manual SNAKE Mode");
  Serial.println("  '0' -> Emergency STOP ALL");
  Serial.println("========================================");
}

void loop() {
  // Always poll keyboard inputs
  checkKeyboard();

  // If we are on Auto-Pilot and the previous mode finished, pick a new UNIQUE one
  if (isAutoMode && currentMode == IDLE) {
    pickRandomMode();
  }

  // -------------------------------------------------------------------------
  // MODE 1: RANDOM RUN WITH OVERLAP (No Consecutive Repeats)
  // -------------------------------------------------------------------------
  if (currentMode == RANDOM_RUN) {
    if (firstRunOfMode) {
      Serial.println("⏳ [RANDOM MODE] Starting 5-second system rest...");
      if (responsiveDelay(startDelayTime)) return; 
      
      randomStep = 0;
      
      // HARDENING: Ensure the first valve does not match the last valve used anywhere else
      do {
        currentValve = random(0, 9);
      } while (currentValve == lastValve);
      
      setValveState(currentValve, ON);
      firstRunOfMode = false;
      Serial.print("🚀 Action Started! Random Valve ");
      Serial.println(currentValve + 1);
    }

    unsigned long totalRandomTime = random(5000, 7001);
    unsigned long soloTime = totalRandomTime - overlapTime;

    if (responsiveDelay(soloTime)) return;

    // HARDENING: Ensure the next valve is never the current valve
    int nextValve;
    do { 
      nextValve = random(0, 9); 
    } while (nextValve == currentValve);

    Serial.print("Overlap Transition -> Opening Valve ");
    Serial.println(nextValve + 1);

    setValveState(nextValve, ON);
    if (responsiveDelay(overlapTime)) return;

    setValveState(currentValve, OFF);
    lastValve = currentValve; // Log this valve into history
    currentValve = nextValve;
    randomStep++;

    // If on Auto-Pilot, cycle out to a new mode after 9 random switches
    if (isAutoMode && randomStep >= 9) {
      Serial.println("\n🔄 Auto-Pilot: Random sequence cycle complete.");
      allValvesOff();
      lastValve = currentValve; // Save final valve selection before clearing
      currentMode = IDLE;
      firstRunOfMode = true;
    }
  }

  // -------------------------------------------------------------------------
  // MODE 2: SEQUENTIAL RUN WITH OVERLAP
  // -------------------------------------------------------------------------
  else if (currentMode == SEQUENTIAL_RUN) {
    if (firstRunOfMode) {
      Serial.println("⏳ [SEQUENTIAL MODE] Starting 5-second system rest...");
      if (responsiveDelay(startDelayTime)) return; 
      
      sequenceStep = 0;
      firstRunOfMode = false;
    }

    int cValve = sequentialOrder[sequenceStep];
    setValveState(cValve, ON);
    Serial.print("Running Valve ");
    Serial.println(cValve + 1);

    if (sequenceStep < 8) {
      if (responsiveDelay(sequentialTotalTime - overlapTime)) return;
      int nValve = sequentialOrder[sequenceStep + 1];
      setValveState(nValve, ON);
      Serial.print("Overlap Transition -> Opening Valve ");
      Serial.println(nValve + 1);
      if (responsiveDelay(overlapTime)) return;
      setValveState(cValve, OFF);
      lastValve = cValve; // Log to cross-mode history
      sequenceStep++;
    } else {
      if (responsiveDelay(sequentialTotalTime)) return;
      setValveState(cValve, OFF);
      lastValve = cValve; // Log final valve to cross-mode history
      
      if (isAutoMode) {
        Serial.println("\n🔄 Auto-Pilot: Sequential sequence cycle complete.");
        currentMode = IDLE;
        firstRunOfMode = true;
      } else {
        sequenceStep = 0; 
      }
    }
  }

  // -------------------------------------------------------------------------
  // MODE 3: SNAKE RUN WITH OVERLAP (1,2,3,6,5,4,7,8,9)
  // -------------------------------------------------------------------------
  else if (currentMode == SNAKE_RUN) {
    if (firstRunOfMode) {
      Serial.println("⏳ [SNAKE MODE] Starting 5-second system rest...");
      if (responsiveDelay(startDelayTime)) return; 
      
      sequenceStep = 0;
      firstRunOfMode = false;
    }

    int cValve = snakeOrder[sequenceStep];
    setValveState(cValve, ON);
    Serial.print("Running Snake Valve ");
    Serial.println(cValve + 1);

    if (sequenceStep < 8) {
      if (responsiveDelay(sequentialTotalTime - overlapTime)) return;
      int nValve = snakeOrder[sequenceStep + 1];
      setValveState(nValve, ON);
      Serial.print("Overlap Transition -> Opening Valve ");
      Serial.println(nValve + 1);
      if (responsiveDelay(overlapTime)) return;
      setValveState(cValve, OFF);
      lastValve = cValve; // Log to cross-mode history
      sequenceStep++;
    } else {
      if (responsiveDelay(sequentialTotalTime)) return;
      setValveState(cValve, OFF);
      lastValve = cValve; // Log final valve to cross-mode history
      
      if (isAutoMode) {
        Serial.println("\n🔄 Auto-Pilot: Snake sequence cycle complete.");
        currentMode = IDLE;
        firstRunOfMode = true;
      } else {
        sequenceStep = 0; 
      }
    }
  }
}

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

// Chooses a fresh mode that is guaranteed to be different than the last one run
void pickRandomMode() {
  SystemMode nextMode;
  
  do {
    int choice = random(0, 3); // Evaluates to 0, 1, or 2
    if (choice == 0) nextMode = RANDOM_RUN;
    else if (choice == 1) nextMode = SEQUENTIAL_RUN;
    else nextMode = SNAKE_RUN;
  } while (nextMode == lastMode); // Reject and reroll if it matches the history buffer
  
  currentMode = nextMode;
  lastMode = currentMode; // Save this choice as the new historical anchor
  firstRunOfMode = true;
}

void checkKeyboard() {
  if (Serial.available() > 0) {
    char key = Serial.read();
    if (key == '\n' || key == '\r') return; 

    if (key == 'a' || key == 'A') {
      isAutoMode = true;
      currentMode = IDLE;
      allValvesOff();
      firstRunOfMode = true;
      Serial.println("\n🤖 Auto-Pilot ENGAGED. Selecting fresh random pattern...");
    }
    else if (key == 'r' || key == 'R') {
      isAutoMode = false;
      currentMode = RANDOM_RUN;
      lastMode = RANDOM_RUN; // Update manual selections into history as well
      allValvesOff();
      firstRunOfMode = true;
      Serial.println("\n🎮 Manual Override: RANDOM MODE forced.");
    }
    else if (key == 's' || key == 'S') {
      isAutoMode = false;
      currentMode = SEQUENTIAL_RUN;
      lastMode = SEQUENTIAL_RUN;
      allValvesOff();
      firstRunOfMode = true;
      Serial.println("\n🎮 Manual Override: SEQUENTIAL MODE forced.");
    }
    else if (key == 'n' || key == 'N') {
      isAutoMode = false;
      currentMode = SNAKE_RUN;
      lastMode = SNAKE_RUN;
      allValvesOff();
      firstRunOfMode = true;
      Serial.println("\n🎮 Manual Override: SNAKE MODE forced.");
    }
    else if (key == '0') {
      isAutoMode = false;
      currentMode = IDLE;
      allValvesOff();
      firstRunOfMode = true;
      Serial.println("\n🛑 Emergency Stop: All operations halted.");
    }
  }
}

void setValveState(int index, int state) {
  if (index < 8) {
    digitalWrite(valvePins[index], state == ON ? LOW : HIGH); // Active-Low (1-8)
  } else {
    digitalWrite(valvePins[8], state == ON ? HIGH : LOW);    // Active-High (9)
  }
}

bool responsiveDelay(unsigned long ms) {
  unsigned long startTimestamp = millis();
  while (millis() - startTimestamp < ms) {
    SystemMode oldMode = currentMode;
    bool oldAuto = isAutoMode;
    checkKeyboard();
    if (currentMode != oldMode || isAutoMode != oldAuto) {
      return true; 
    }
    delay(10);
  }
  return false;
}

void allValvesOff() {
  for (int i = 0; i < 8; i++) digitalWrite(valvePins[i], HIGH);
  digitalWrite(valvePins[8], LOW);
}
```

# More Formalized Pictures.

![](images/pptp/finalizing/formal-23-40-33.jpg)
![](images/pptp/finalizing/formal-23-41-01.jpg)

![](images/pptp/finalizing/formal-23-41-19.jpg)
![](images/pptp/finalizing/formal-23-41-37.jpg)

![](images/pptp/finalizing/formal-23-41-59.jpg)

# Final Testing Video

@video[](images/pptp/finalizing/formal-testing3-more-professional.mp4)
