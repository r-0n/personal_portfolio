$outDir = $PSScriptRoot
function Page($title, $body) {
@"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#101010">
    <title>$title || Aaron Wajah</title>
    <link rel="icon" type="image/png" href="../images/logo-no-background.png">
    <link rel="stylesheet" href="../css/index.css">
    <link rel="stylesheet" href="../css/projects.css">
</head>
<body class="case-study-page" data-base="../">
    <div id="case-chrome-top"></div>
    $body
    <div id="case-chrome-bottom"></div>
    <script src="../js/case-study.js" defer></script>
</body>
</html>
"@
}

$pages = @{}

$pages['visages-of-fanaticism.html'] = @{
    title = 'Visages of Fanaticism'
    body = @'
<main class="case-study">
    <header class="case-hero">
        <div class="case-hero-visual"><canvas id="mask-canvas"></canvas></div>
        <div>
            <div class="case-kicker">Parametric & Computational Design</div>
            <h1>Visages of <span class="color">Fanaticism</span></h1>
            <p class="case-subtitle">A differential mask that translates Ghanaian Densu Priest iconography into an algorithmically grown 3D mesh.</p>
            <p class="case-role">Role: Sole Designer · Grasshopper Scripter · Additive Manufacturer</p>
        </div>
    </header>
    <div class="case-meta">
        <div><h6>Year / Status</h6><p>2024 · Completed</p></div>
        <div><h6>Discipline</h6><p>Cultural computation, digital fabrication</p></div>
        <div><h6>Tools & Tech</h6><p>Rhino Grasshopper, 3D print, WEBGL</p></div>
        <div><h6>Links</h6><p><a href="../index.html#portfolio">Portfolio hub</a></p></div>
    </div>
    <section class="case-section">
        <h2>The Conceptual <span>Blueprint</span></h2>
        <p>Fanaticism here is not spectacle — it is devotion encoded in geometry. Traditional Densu Priest masks carry lineage, ritual, and surface as one object. This project asks what happens when that cultural intelligence is allowed to grow through differential mesh operations instead of being copied as ornament.</p>
    </section>
    <section class="case-section">
        <h2>Interactive <span>3D</span></h2>
        <p>Rotate the generated mask with the pointer. The canvas rebuilds a faceted shell from polar noise — a stand-in for the Grasshopper differential mesh until a GLB export is embedded via model-viewer.</p>
    </section>
    <section class="case-section">
        <h2>Visual Process <span>Comparison</span></h2>
        <p>Drag the handle to compare a photographic / ritual reading of the face with the algorithmic mesh.</p>
        <div class="compare" id="mask-compare">
            <div class="compare-base"><img src="../images/aaron.jpeg" alt="Source portrait as ritual stand-in"></div>
            <div class="compare-overlay"><canvas id="mask-overlay"></canvas></div>
            <div class="compare-handle"></div>
        </div>
    </section>
    <section class="case-section">
        <h2>Algorithmic <span>Breakdown</span></h2>
        <ul>
            <li>Base cultural silhouette extracted as a boundary curve.</li>
            <li>Differential growth relaxes the mesh while preserving ritual landmarks (eyes, brow, mouth).</li>
            <li>Surface subdivision carries denser tessellation where the original mask concentrates symbolic load.</li>
        </ul>
    </section>
    <section class="case-section">
        <h2>Physical Artifacts &amp; <span>Exhibition</span></h2>
        <div class="gallery">
            <figure><img src="../images/aaron.jpeg" alt="Portrait study"><figcaption>Source reading of the face</figcaption></figure>
            <figure><img src="../images/radial slicing method.jpeg" alt="Fabrication logic"><figcaption>Slice / growth logic for additive manufacture</figcaption></figure>
            <figure><img src="../images/lampshade.png" alt="Printed artifact analog"><figcaption>Printed shell as physical proof</figcaption></figure>
        </div>
    </section>
    <section class="case-section">
        <h2>Next <span>Steps</span></h2>
        <p>Embed the Grasshopper-exported GLB in &lt;model-viewer&gt;, and pair the live mesh with the process booklet PDF in-page.</p>
    </section>
    <nav class="case-pager">
        <a href="the-outer-experience.html"><small>Previous</small>The Outer Experience</a>
        <a class="next" href="carapace.html"><small>Next</small>Carapace</a>
    </nav>
</main>
<script>
function drawMask(canvas, color) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 640;
    const h = canvas.height = canvas.clientHeight || 360;
    let rot = 0;
    function frame() {
        rot += 0.008;
        ctx.fillStyle = '#050505';
        ctx.fillRect(0,0,w,h);
        ctx.save();
        ctx.translate(w/2, h/2 + 10);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        for (let ring = 4; ring <= 18; ring++) {
            ctx.beginPath();
            for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.12) {
                const n = Math.sin(a * 5 + rot) * 8 + Math.cos(a * 3 - rot * 1.4) * 6;
                const r = ring * 7 + n;
                const x = Math.cos(a + rot * 0.2) * r * 0.72;
                const y = Math.sin(a) * r;
                if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.restore();
        requestAnimationFrame(frame);
    }
    frame();
}
window.addEventListener('load', function() {
    const accent = getComputedStyle(document.querySelector('.color')).color || '#c70039';
    drawMask(document.getElementById('mask-canvas'), accent);
    const overlay = document.getElementById('mask-overlay');
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    drawMask(overlay, accent);
});
</script>
'@
}

# carapace.html is hand-authored from Carapace.pdf — do not overwrite it here.

$pages['the-crawler.html'] = @{
    title = 'The Crawler'
    body = @'
<main class="case-study">
    <header class="case-hero">
        <div class="case-hero-visual"><img src="../images/robot.jpg" alt="The Crawler robot"></div>
        <div>
            <div class="case-kicker">Robotics & Physical Computing</div>
            <h1>The <span class="color">Crawler</span></h1>
            <p class="case-subtitle">A six-legged robot that advances when you look away from your phone — and retreats when screen-time spikes.</p>
            <p class="case-role">Role: Physical computing lead · Interaction designer</p>
        </div>
    </header>
    <div class="case-meta">
        <div><h6>Year / Status</h6><p>2023 · Prototype</p></div>
        <div><h6>Discipline</h6><p>Robotics, speculative critique</p></div>
        <div><h6>Tools & Tech</h6><p>Arduino, servos, sensors</p></div>
        <div><h6>Links</h6><p><a href="https://drive.google.com/drive/folders/1L2CpFvaMMK2RYS_706ET2c2iG6Z-OXsb?usp=sharing" target="_blank" rel="noopener">Project folder</a></p></div>
    </div>
    <section class="case-section">
        <h2>The Conceptual <span>Blueprint</span></h2>
        <p>The Crawler makes smartphone dependence spatial. Attention is no longer private: it drives gait. The machine becomes a moral actor in the room — approaching when you reclaim the world, fleeing when the glass wins.</p>
    </section>
    <section class="case-section">
        <h2>System <span>Flow</span></h2>
        <div class="flow">
            <div class="flow-node">Phone screen-time sensor</div>
            <div class="flow-arrow">→</div>
            <div class="flow-node">Microcontroller decision matrix</div>
            <div class="flow-arrow">→</div>
            <div class="flow-node">Pursue / retreat gait</div>
            <div class="flow-arrow">→</div>
            <div class="flow-node">6-leg servo locomotion</div>
        </div>
    </section>
    <section class="case-section">
        <h2>Physical <span>Artifact</span></h2>
        <div class="gallery">
            <figure><img src="../images/robot.jpg" alt="Chassis"><figcaption>Arduino chassis and wiring as the living body</figcaption></figure>
            <figure><img src="../images/A400.png" alt="CAD analog"><figcaption>Mechanical thinking adjacent to the build</figcaption></figure>
            <figure><img src="../images/robot.jpg" alt="Motion still"><figcaption>Hero still for the pursuit / retreat loop</figcaption></figure>
        </div>
    </section>
    <nav class="case-pager">
        <a href="carapace.html"><small>Previous</small>Carapace</a>
        <a class="next" href="dr-orchid.html"><small>Next</small>Dr. Orchid</a>
    </nav>
</main>
'@
}

$pages['dr-orchid.html'] = @{
    title = 'Dr. Orchid'
    body = @'
<main class="case-study">
    <header class="case-hero">
        <div class="case-hero-visual"><img src="../images/aaron.jpg" alt="Performance context"></div>
        <div>
            <div class="case-kicker">Robotics & Physical Computing</div>
            <h1>Dr. <span class="color">Orchid</span></h1>
            <p class="case-subtitle">A performing robot whose technical skeleton and theatrical body share one stage — NYUAD Blue Hall.</p>
            <p class="case-role">Role: Robotics designer · Performance collaborator</p>
        </div>
    </header>
    <div class="case-meta">
        <div><h6>Year / Status</h6><p>2024 · Performed</p></div>
        <div><h6>Discipline</h6><p>Performing robots</p></div>
        <div><h6>Tools & Tech</h6><p>Multi-servo, LED arrays, mobile chassis</p></div>
        <div><h6>Links</h6><p><a href="../index.html#portfolio">Portfolio hub</a></p></div>
    </div>
    <section class="case-section">
        <h2>The Conceptual <span>Blueprint</span></h2>
        <p>Dr. Orchid is not a demo of motors. It is a character. The lab coat is costume and Faraday cage; the articulate head is both kinematics and gaze.</p>
    </section>
    <section class="case-section split-2">
        <div class="panel">
            <h3>Technical skeleton</h3>
            <ul>
                <li>Multi-servo articulate head and hands</li>
                <li>LED arrays as emotional telemetry</li>
                <li>Mobile chassis with custom power distribution</li>
            </ul>
        </div>
        <div class="panel">
            <h3>Theatrical performance</h3>
            <p>Live stage footage context: NYUAD Blue Hall. The costume (lab coat) completes the scientist-oracle figure — the robot as colleague, not prop.</p>
            <img src="../images/aaron.jpg" alt="Stage atmosphere" style="width:100%;border-radius:10px;margin-top:12px;">
        </div>
    </section>
    <nav class="case-pager">
        <a href="the-crawler.html"><small>Previous</small>The Crawler</a>
        <a class="next" href="solidworks-robotic-arm.html"><small>Next</small>SolidWorks Robotic Arm</a>
    </nav>
</main>
'@
}

$pages['solidworks-robotic-arm.html'] = @{
    title = 'SolidWorks Robotic Arm'
    body = @'
<main class="case-study">
    <header class="case-hero">
        <div class="case-hero-visual"><img src="../images/A400.png" alt="SolidWorks assembly"></div>
        <div>
            <div class="case-kicker">Robotics & Physical Computing</div>
            <h1>SolidWorks <span class="color">Robotic Arm</span></h1>
            <p class="case-subtitle">Kinematic assembly, joint stacks, and motion paths modeled for fabrication — engineering as a visible argument.</p>
            <p class="case-role">Role: CAD engineer · Mechanical designer</p>
        </div>
    </header>
    <div class="case-meta">
        <div><h6>Year / Status</h6><p>2023 · Portfolio</p></div>
        <div><h6>Discipline</h6><p>Mechanical design</p></div>
        <div><h6>Tools & Tech</h6><p>SolidWorks, motion study</p></div>
        <div><h6>Links</h6><p><a href="https://drive.google.com/drive/folders/1mNgBJcHpwds5xIS2B8qpwK1UnZb58bCg?usp=sharing" target="_blank" rel="noopener">SolidWorks folder</a></p></div>
    </div>
    <section class="case-section">
        <h2>Algorithmic &amp; Technical <span>Breakdown</span></h2>
        <p>The arm is a chain of constrained mates. Motion paths are not decoration: they prove reach, collision, and manufacturable travel before metal exists.</p>
        <div class="flow">
            <div class="flow-node">Base / yaw</div><div class="flow-arrow">→</div>
            <div class="flow-node">Shoulder pitch</div><div class="flow-arrow">→</div>
            <div class="flow-node">Elbow</div><div class="flow-arrow">→</div>
            <div class="flow-node">Wrist / end effector</div>
        </div>
    </section>
    <nav class="case-pager">
        <a href="dr-orchid.html"><small>Previous</small>Dr. Orchid</a>
        <a class="next" href="magnesynth.html"><small>Next</small>Magnesynth</a>
    </nav>
</main>
'@
}

$pages['magnesynth.html'] = @{
    title = 'Magnesynth'
    body = @'
<main class="case-study">
    <header class="case-hero">
        <div class="case-hero-visual"><img src="../images/Guitar.PNG" alt="Magnesynth instrument context"></div>
        <div>
            <div class="case-kicker">Interactive Audio & Architecture</div>
            <h1><span class="color">Magnesynth</span></h1>
            <p class="case-subtitle">Electromagnetic actuation and a custom 3D-printed NeoPixel housing — sound as a fabricated object. Shown at Sound Kitchen, Sharjah.</p>
            <p class="case-role">Role: Instrument designer · Fabricator · Performer</p>
        </div>
    </header>
    <div class="case-meta">
        <div><h6>Year / Status</h6><p>2024 · Exhibited</p></div>
        <div><h6>Discipline</h6><p>Audio, speculative tech</p></div>
        <div><h6>Tools & Tech</h6><p>NeoPixels, electromagnets, CAD</p></div>
        <div><h6>Links</h6><p><a href="https://drive.google.com/drive/folders/16ftxPslitLd_AMZE2SNyU5OGyyu9VSnD?usp=sharing" target="_blank" rel="noopener">Music / video folder</a></p></div>
    </div>
    <section class="case-section">
        <h2>Audio / Visual <span>Player</span></h2>
        <p>Exhibition documentation lives with the acoustic sessions archive. Embed additional Sharjah clips here as they are published.</p>
        <iframe class="live-embed" style="min-height:360px" src="https://drive.google.com/file/d/111HAIDKbzcPbOz30riHu4U_2w3MTAUsK/preview" allow="autoplay" loading="lazy" title="Session documentation"></iframe>
    </section>
    <section class="case-section">
        <h2>Fabrication <span>Highlights</span></h2>
        <div class="split-2">
            <div class="panel">
                <h3>NeoPixel housing</h3>
                <p>Custom 3D-printed body routes light as a score — LEDs are not UI, they are timbre you can see.</p>
            </div>
            <div class="panel">
                <h3>Electromagnetic actuation</h3>
                <p>Coils drive physical vibration. The instrument is a circuit that insists on being touched.</p>
            </div>
        </div>
    </section>
    <nav class="case-pager">
        <a href="solidworks-robotic-arm.html"><small>Previous</small>SolidWorks Robotic Arm</a>
        <a class="next" href="kinetic-ellipse.html"><small>Next</small>Kinetic Ellipse</a>
    </nav>
</main>
'@
}

$pages['kinetic-ellipse.html'] = @{
    title = 'Kinetic Ellipse'
    body = @'
<main class="case-study">
    <header class="case-hero">
        <div class="case-hero-visual"><img src="../images/lampshade.png" alt="Kinetic ellipse analog"></div>
        <div>
            <div class="case-kicker">Interactive Audio & Architecture</div>
            <h1>Kinetic <span class="color">Ellipse</span></h1>
            <p class="case-subtitle">A Java / Processing 3D simulation of 130 trigonometrically calculated columns, serialized to an Arduino prototype of NeoPixels and motors.</p>
            <p class="case-role">Role: Software + hardware bridge</p>
        </div>
    </header>
    <div class="case-meta">
        <div><h6>Year / Status</h6><p>2023 · Prototype</p></div>
        <div><h6>Discipline</h6><p>Kinetic architecture</p></div>
        <div><h6>Tools & Tech</h6><p>Processing, Serial, Arduino</p></div>
        <div><h6>Links</h6><p><a href="../index.html#portfolio">Portfolio hub</a></p></div>
    </div>
    <section class="case-section">
        <h2>Serial Communication <span>Diagram</span></h2>
        <div class="flow">
            <div class="flow-node">Processing 3D sim<br>130 trig columns</div>
            <div class="flow-arrow">→</div>
            <div class="flow-node">Serial bridge<br>byte stream</div>
            <div class="flow-arrow">→</div>
            <div class="flow-node">Arduino</div>
            <div class="flow-arrow">→</div>
            <div class="flow-node">NeoPixels + motors</div>
        </div>
        <p style="margin-top:18px">The physical ellipse is a low-resolution proof of a high-resolution computation. Columns that exist as sine and cosine in software become light and torque in space.</p>
    </section>
    <nav class="case-pager">
        <a href="magnesynth.html"><small>Previous</small>Magnesynth</a>
        <a class="next" href="chain-farms.html"><small>Next</small>Chain Farms</a>
    </nav>
</main>
'@
}

$pages['chain-farms.html'] = @{
    title = 'Chain Farms'
    body = @'
<main class="case-study">
    <header class="case-hero">
        <div class="case-hero-visual"><img src="../images/radial slicing method.jpeg" alt="Field systems analog"></div>
        <div>
            <div class="case-kicker">Smart Systems & AgTech</div>
            <h1>Chain <span class="color">Farms</span></h1>
            <p class="case-subtitle">A research map where autonomous robotics, cash crops, and sensor grids share one cadastral logic.</p>
            <p class="case-role">Role: Systems designer · Research lead</p>
        </div>
    </header>
    <div class="case-meta">
        <div><h6>Year / Status</h6><p>2025 · Ongoing</p></div>
        <div><h6>Discipline</h6><p>AgTech, spatial computing</p></div>
        <div><h6>Tools & Tech</h6><p>LiDAR, robotics, sensor networks</p></div>
        <div><h6>Links</h6><p><a href="../index.html#portfolio">Portfolio hub</a></p></div>
    </div>
    <section class="case-section">
        <h2>Interactive Research <span>Map</span></h2>
        <p>Legend: crimson = robot corridors, teal = sensor nodes, green = crop blocks, mute = service path. Replace cells with LiDAR tiles as the survey lands.</p>
        <div class="farm-map" id="farm-map"></div>
    </section>
    <section class="case-section">
        <h2>Next <span>Steps</span></h2>
        <p>Smart farm division: parcel the grid by crop value, water stress, and robot duty cycle rather than by fence line.</p>
    </section>
    <nav class="case-pager">
        <a href="kinetic-ellipse.html"><small>Previous</small>Kinetic Ellipse</a>
        <a class="next" href="pneumitecture.html"><small>Next</small>Pneumitecture</a>
    </nav>
</main>
<script>
window.addEventListener('load', function(){
    const types=['crop','sensor','path','robot','crop','sensor','crop','path','robot','crop','sensor','path'];
    const labels={crop:'Crop',sensor:'Sensor',path:'Path',robot:'Robot'};
    const map=document.getElementById('farm-map');
    for(let i=0;i<36;i++){
        const t=types[i%types.length];
        const el=document.createElement('div');
        el.className='farm-cell '+t;
        el.textContent=labels[t];
        map.appendChild(el);
    }
});
</script>
'@
}

$pages['pneumitecture.html'] = @{
    title = 'Pneumitecture'
    body = @'
<main class="case-study">
    <header class="case-hero">
        <div class="case-hero-visual"><img src="../images/logo-no-background.png" alt="Pneumitecture mark" style="object-fit:contain;padding:48px;background:#050505;"></div>
        <div>
            <div class="case-kicker">Smart Systems & AgTech</div>
            <h1><span class="color">Pneumitecture</span></h1>
            <p class="case-subtitle">Capstone: architecture that inhales. Pneumatic structure as a living spatial system — documented on its dedicated site.</p>
            <p class="case-role">Role: Capstone author</p>
        </div>
    </header>
    <div class="case-meta">
        <div><h6>Year / Status</h6><p>2025 · Capstone</p></div>
        <div><h6>Discipline</h6><p>Pneumatic architecture</p></div>
        <div><h6>Tools & Tech</h6><p>Computation, fabrication, pneumatics</p></div>
        <div><h6>Links</h6><p><a href="https://r-0n.github.io/Capstone-Pneumitecture/" target="_blank" rel="noopener">Live capstone site</a></p></div>
    </div>
    <section class="case-section">
        <h2>The Conceptual <span>Blueprint</span></h2>
        <p>If a building can hold air as structure, it can also hold time. Pneumitecture treats inflation as a design operation — not a party trick — and the full research lives on the capstone microsite so the argument can breathe at its own scale.</p>
        <p><a class="hub-cta" href="https://r-0n.github.io/Capstone-Pneumitecture/" target="_blank" rel="noopener">Open the capstone site →</a></p>
    </section>
    <nav class="case-pager">
        <a href="chain-farms.html"><small>Previous</small>Chain Farms</a>
        <a class="next" href="the-outer-experience.html"><small>Next</small>The Outer Experience</a>
    </nav>
</main>
'@
}

$pages['the-outer-experience.html'] = @{
    title = 'The Outer Experience'
    body = @'
<main class="case-study">
    <header class="case-hero">
        <div class="case-hero-visual"><img src="../images/aaron.jpg" alt="The Outer Experience"></div>
        <div>
            <div class="case-kicker">Interactive Web</div>
            <h1>The Outer <span class="color">Experience</span></h1>
            <p class="case-subtitle">A p5.js / WEBGL passage between galaxies — sun, Jupiter, gas bodies, and three skies — playable in the page.</p>
            <p class="case-role">Role: Creative coder</p>
        </div>
    </header>
    <div class="case-meta">
        <div><h6>Year / Status</h6><p>2023 · Live</p></div>
        <div><h6>Discipline</h6><p>Interactive web, WEBGL</p></div>
        <div><h6>Tools & Tech</h6><p>p5.js, WEBGL</p></div>
        <div><h6>Links</h6><p><a href="https://editor.p5js.org/r-0n/full/7mAvW_oL2" target="_blank" rel="noopener">Fullscreen editor</a></p></div>
    </div>
    <section class="case-section">
        <h2>Live <span>Canvas</span></h2>
        <p>The experience is embedded rather than exiled to another tab. Use fullscreen via the p5 editor link if the iframe feels small.</p>
        <iframe class="live-embed" src="https://editor.p5js.org/r-0n/full/7mAvW_oL2" loading="lazy" title="The Outer Experience"></iframe>
    </section>
    <nav class="case-pager">
        <a href="pneumitecture.html"><small>Previous</small>Pneumitecture</a>
        <a class="next" href="visages-of-fanaticism.html"><small>Next</small>Visages of Fanaticism</a>
    </nav>
</main>
'@
}

foreach ($name in $pages.Keys) {
    if ($name -eq 'carapace.html') { continue }
    $p = $pages[$name]
    $html = Page $p.title $p.body
    [System.IO.File]::WriteAllText((Join-Path $outDir $name), $html)
    Write-Host "wrote $name"
}
