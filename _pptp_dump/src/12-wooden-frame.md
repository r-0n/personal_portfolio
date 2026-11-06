---
slug: wooden-frame
title: Wooden Frame & More Testing
date: 
heading: Wooden Frame & More Testing
url: https://app.notion.com/p/3a97962f620780d2adf3f93026b29d74
---
With the help of Tony (manager of the scene shop), I was able to bring the frame that was designed and simulatated in Rhino 3D Grasshopper (Fig. 1) to life.

![Fig. 1 · Frame designed and simulated in Rhino 3D Grasshopper](images/pptp/wooden-frame/frame-rhino-grasshopper-Frame_00040.png)

## Pictures of Physical Frame

![](images/pptp/wooden-frame/physical-frame-23-34-52.jpg)

After, I installed the aluminium rods, inserted the electronics at the base of the frame, and installed the inflatable (balloon because time did not permit me to install TPU heat-sealed designs). Below is how they turned out.

![](images/pptp/wooden-frame/assembled-23-38-09.jpg)
![](images/pptp/wooden-frame/assembled-23-39-05.jpg)
![](images/pptp/wooden-frame/assembled-23-38-38.jpg)

# Testing

After assembling everything, I did some more testing. Here’s how they turned out.

@video[](images/pptp/wooden-frame/Final_Testing_Pneumitecture_1.mp4)

Below is the code I used for testing

```cpp
//Title: Inflation testing with key toggle
//date: 26/06/2026
//author: Aaron Wajah


// Define the pins for valves 1, 2, and 3
const int valve1 = 2;
const int valve2 = 3;
const int valve3 = 4;
const int valve4 = 5;
const int valve5 = 6;
const int valve6 = 7;
const int valve7 = 8;
const int valve8 = 9;
const int valve9 = 10;


void setup() {
  Serial.begin(9600);
  
  // Set pins as output
  pinMode(valve1, OUTPUT);
  pinMode(valve2, OUTPUT);
  pinMode(valve3, OUTPUT);
  pinMode(valve4, OUTPUT);
  pinMode(valve5, OUTPUT);
  pinMode(valve6, OUTPUT);
  pinMode(valve7, OUTPUT);
  pinMode(valve8, OUTPUT);
  pinMode(valve9, OUTPUT);


  // Start with all valves OFF
  digitalWrite(valve1, HIGH);
  digitalWrite(valve2, HIGH);
  digitalWrite(valve3, HIGH);
  digitalWrite(valve4, HIGH);
  digitalWrite(valve5, HIGH);
  digitalWrite(valve6, HIGH);
  digitalWrite(valve7, HIGH);
  digitalWrite(valve8, HIGH);
  digitalWrite(valve9, LOW);
  
  
  Serial.println("Valve Control Ready!");
  Serial.println("Press '1', '2', or '3...' to TOGGLE that valve.");
}

void loop() {
  if (Serial.available() > 0) {
    char key = Serial.read();
    
    // Toggle logic: If OFF, turn ON; if ON, turn OFF
    switch (key) {
      case '1':
        digitalWrite(valve1, !digitalRead(valve1));
        Serial.print("Valve 1 is now: ");
        Serial.println(digitalRead(valve1) ? "OFF" : "ON");
        break;
        
      case '2':
        digitalWrite(valve2, !digitalRead(valve2));
        Serial.print("Valve 2 is now: ");
        Serial.println(digitalRead(valve2) ? "OFF" : "ON");
        break;
        
      case '3':
        digitalWrite(valve3, !digitalRead(valve3));
        Serial.print("Valve 3 is now: ");
        Serial.println(digitalRead(valve3) ? "OFF" : "ON");
        break;

      case '4':
        digitalWrite(valve4, !digitalRead(valve4));
        Serial.print("Valve 4 is now: ");
        Serial.println(digitalRead(valve4) ? "OFF" : "ON");
        break;

      case '5':
        digitalWrite(valve5, !digitalRead(valve5));
        Serial.print("Valve 5 is now: ");
        Serial.println(digitalRead(valve5) ? "OFF" : "ON");
        break;

      case '6':
        digitalWrite(valve6, !digitalRead(valve6));
        Serial.print("Valve 6 is now: ");
        Serial.println(digitalRead(valve6) ? "OFF" : "ON");
        break;

      case '7':
        digitalWrite(valve7, !digitalRead(valve7));
        Serial.print("Valve 7 is now: ");
        Serial.println(digitalRead(valve7) ? "OFF" : "ON");
        break;

      case '8':
        digitalWrite(valve8, !digitalRead(valve8));
        Serial.print("Valve 8 is now: ");
        Serial.println(digitalRead(valve8) ? "OFF" : "ON");
        break;

      case '9':
        digitalWrite(valve9, !digitalRead(valve9));
        Serial.print("Valve 9 is now: ");
        Serial.println(digitalRead(valve9) ? "ON" : "OFF");
        break;

    }
  }
}
```
