---
slug: nine-valves
title: 05/06/2026 Circuit Connection for 9 Solenoid Valves wiring all 9 valves)
date: 05/06/2026
heading: Circuit Connection for 9 Solenoid Valves (wiring all 9 valves)
url: https://app.notion.com/p/3767962f620780b58591f700ad31d693
---
My first approach to wiring all the solenoid valves was to rinse and repeat the single circuit connection made in [Wiring Up a 3 by 2 …](#solenoid-wiring) (Under Testing The Pneumatic Solenoid Valve With Arduino Control title of the same documentation post) post I made a few days ago for 9 valves.

## To demonstrate graphically:

the circuit connection for a single solenoid valve in (Fig. 1) repeated nine times as seen in (Fig. 2 & 3) and in the last video.

![Fig. 1](images/pptp/nine-valves/fig1-single-circuit-13-15-57.jpg)
![Fig. 2](images/pptp/nine-valves/fig2-nine-valves-15-21-48.jpg)

![](images/pptp/nine-valves/fig3-nine-valves-15-21-57.jpg)
@video[](images/pptp/nine-valves/nine-valves-video_15-22-05.mp4)

But I soon realized this approach would lead to a mess of wires if I transitioned from a DC power supplier machine to a battery for neater, easy-to-portable build.

My alternative to creating a neater circuit was to use a channel relay module and other components that made wiring 99% neat. See [Transitioning to a Neater Build](#neater-build) for my alternative approach.
