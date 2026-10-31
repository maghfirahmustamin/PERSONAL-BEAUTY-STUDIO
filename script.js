
const $ = id => document.getElementById(id);

let uploadedImage = null;
let analysis = null;
let cameraStream = null;

// DATABASE 500 WARNA

const palettes = {
  Warm: [
    "#D99A72","#C77B52","#E8B66A","#A65E39",
    "#D7A16B","#8D5038","#E6C18A","#B96B43"
  ],

  Cool: [
    "#B8A0C9","#A7B9D8","#D9A6B5","#786A9D",
    "#C7B8DD","#8D9DBD","#D5AFC8","#637C9D"
  ],

  Neutral: [
    "#C9A38D","#B88F86","#D5B5A0","#A9897C",
    "#C5A69A","#96766D","#E0C4AD","#AD9188"
  ]
};

const names = [
  "Rose Pink","Dusty Rose","Peach","Mocha","Caramel",
  "Lavender","Mauve","Coral","Terracotta","Nude",
  "Champagne","Berry","Plum","Chocolate","Cream",
  "Sage","Olive","Burgundy","Taupe","Blush"
];

const categories = [
  "Hijab","Lipstick","Blush","Eyeshadow","Foundation"
];

const colors = [];

for (let i = 0; i < 500; i++) {
  const group = Object.keys(palettes)[i % 3];
  const base = palettes[group][i % 8];

  const variation = Math.floor(i / 24);

  const value = parseInt(base.slice(1),16);

  const r = Math.min(255,((value >> 16) & 255) + variation * 2);
  const g = Math.min(255,((value >> 8) & 255) + variation);
  const b = Math.min(255,(value & 255) + variation * 2);

  const hex = "#" + [r,g,b]
    .map(v => v.toString(16).padStart(2,"0"))
    .join("");

  colors.push({
    name: names[i % names.length] + " " + (i + 1),
    hex,
    category: categories[i % 5],
    undertone: group
  });
}

// UPLOAD PHOTO

$("photoInput").addEventListener("change", event => {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please upload an image.");
    return;
  }

  const reader = new FileReader();

  reader.onload = e => {
    uploadedImage = e.target.result;
    showPhoto();
  };

  reader.readAsDataURL(file);
});

function showPhoto() {

  // Analysis photo
  $("facePreview").src = uploadedImage;
  $("facePreview").style.display = "block";
  $("emptyPhoto").style.display = "none";

  // Circular face in color wheel
  $("wheelFace").src = uploadedImage;
  $("wheelFace").style.display = "block";
  $("wheelPlaceholder").style.display = "none";

}

// CAMERA

$("cameraBtn").onclick = async () => {

  try {

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }
    });

    $("camera").srcObject = cameraStream;
    $("camera").hidden = false;
    $("captureBtn").hidden = false;

  } catch (error) {

    alert("Camera tidak dapat diakses. Izinkan akses kamera.");

  }

};

$("captureBtn").onclick = () => {

  const video = $("camera");

  const canvas = document.createElement("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  canvas.getContext("2d").drawImage(video,0,0);

  uploadedImage = canvas.toDataURL("image/png");

  showPhoto();

  cameraStream?.getTracks().forEach(track => track.stop());

  $("camera").hidden = true;
  $("captureBtn").hidden = true;

};

// ANALYSIS

$("analyzeBtn").onclick = () => {

  if (!uploadedImage) {
    alert("Upload foto wajah terlebih dahulu!");
    return;
  }

  const skin = $("skinTone").value;
  const under = $("undertone").value;

  let season;

  if (under === "Warm") {
    season = skin === "Light" ? "Spring" : "Autumn";
  } else if (under === "Cool") {
    season = skin === "Deep" ? "Winter" : "Summer";
  } else {
    season = "Neutral";
  }

  analysis = {
    skin,
    under,
    season,
    hair: $("hairColor").value,
    eyes: $("eyeColor").value
  };

  $("seasonResult").textContent = season;

  $("descriptionResult").textContent =
    `Your selected profile is ${skin} skin with ${under} undertone. Explore the ${season} color palette.`;

  $("resultSkin").textContent = skin;
  $("resultUnder").textContent = under;
  $("resultSeason").textContent = season;

  $("analysisResult").hidden = false;

  renderRecommended();
  renderColorWheel();
  renderColors();
  renderReport();

  $("analysisResult").scrollIntoView({
    behavior: "smooth"
  });

};

// RECOMMENDED COLORS

function renderRecommended() {

  const palette = palettes[analysis.under];

  $("recommendedColors").innerHTML = "";

  palette.forEach(color => {

    const button = document.createElement("button");

    button.className = "recommend-swatch";
    button.style.background = color;
    button.title = color;

    button.onclick = () => selectWheelColor(color);

    $("recommendedColors").appendChild(button);

  });

}

// PERSONAL COLOR WHEEL

function renderColorWheel() {

  const wheel = $("wheelColors");

  wheel.innerHTML = "";

  const palette = palettes[analysis.under];

  palette.forEach((color,index) => {

    const angle = (index * 360 / palette.length) - 90;
    const radius = 42;

    const x = 50 + radius * Math.cos(angle * Math.PI / 180);
    const y = 50 + radius * Math.sin(angle * Math.PI / 180);

    const button = document.createElement("button");

    button.className = "wheel-color";
    button.style.left = x + "%";
    button.style.top = y + "%";
    button.style.background = color;

    const label = document.createElement("span");

    label.textContent = color;

    button.appendChild(label);

    button.onclick = () => {

      selectWheelColor(color);

      document.querySelectorAll(".wheel-color")
        .forEach(item => item.classList.remove("selected"));

      button.classList.add("selected");

    };

    wheel.appendChild(button);

  });

}

function selectWheelColor(color) {

  $("selectedColor").textContent = "Selected Color: " + color;

  $("hijabColor").value = color;

}

// COLOR LIBRARY

function renderColors() {

  const category = $("categoryFilter").value;
  const search = $("colorSearch").value.toLowerCase();
  const match = $("matchFilter").value;

  const filtered = colors.filter(color => {

    const categoryMatch =
      category === "all" || color.category === category;

    const searchMatch =
      color.name.toLowerCase().includes(search) ||
      color.hex.toLowerCase().includes(search);

    const matchResult =
      match === "all" ||
      (analysis && color.undertone === analysis.under);

    return categoryMatch && searchMatch && matchResult;

  });

  $("colorLibrary").innerHTML = filtered.map(color => `

    <div class="color-item">

      <div class="color-box"
        style="background:${color.hex}">
      </div>

      <h4>${color.name}</h4>

      <p>${color.category}</p>

      <p>${color.hex}</p>

      <p>${color.undertone}</p>

    </div>

  `).join("");

  $("colorCount").textContent =
    `Showing ${filtered.length} of 500 colors`;

}

["categoryFilter","matchFilter","colorSearch"].forEach(id => {

  $(id).addEventListener("input",renderColors);

});

renderColors();

// REPORT

function renderReport() {

  if (!analysis) return;

  const recommended = palettes[analysis.under];

  let avoided = [];

  if (analysis.under === "Warm") {
    avoided = ["Icy Blue","Cool Lavender","Blue Pink"];
  }

  if (analysis.under === "Cool") {
    avoided = ["Orange","Mustard","Warm Yellow"];
  }

  if (analysis.under === "Neutral") {
    avoided = ["Very Neon Orange","Very Icy Blue"];
  }

  $("reportContent").innerHTML = `

    <p><b>Skin Tone:</b> ${analysis.skin}</p>

    <p><b>Undertone:</b> ${analysis.under}</p>

    <p><b>Seasonal Color:</b> ${analysis.season}</p>

    <p><b>Hair Color:</b> ${analysis.hair}</p>

    <p><b>Eye Color:</b> ${analysis.eyes}</p>

    <h3>Recommended Colors</h3>

    <p>${recommended.join(", ")}</p>

    <h3>Colors to Explore Carefully</h3>

    <p>${avoided.join(", ")}</p>

    <h3>Makeup Recommendations</h3>

    <p>
      Explore ${analysis.under.toLowerCase()} undertone
      shades for lipstick, blush and eyeshadow.
      Test foundation on your jawline in natural light.
    </p>

    <p>
      <small>
        This is a preliminary recommendation based on your
        selected profile, not an automated AI diagnosis.
      </small>
    </p>

  `;

}

// DOWNLOAD PDF

$("downloadReport").onclick = () => {

  if (!analysis) {
    alert("Complete your beauty analysis first!");
    return;
  }

  if (!window.jspdf) {
    alert("PDF library belum dimuat. Periksa koneksi internet.");
    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  doc.setFillColor(255,240,243);
  doc.rect(0,0,210,45,"F");

  doc.setTextColor(180,105,130);
  doc.setFontSize(18);

  doc.text("PERSONAL BEAUTY STUDIO",20,20);

  doc.setFontSize(11);
  doc.text("YOUR PERSONAL BEAUTY REPORT",20,31);

  doc.setTextColor(65,50,55);
  doc.setFontSize(12);

  let y = 60;

  const content = [

    "PERSONAL BEAUTY PROFILE",

    `Skin Tone: ${analysis.skin}`,
    `Undertone: ${analysis.under}`,
    `Seasonal Color: ${analysis.season}`,
    `Hair Color: ${analysis.hair}`,
    `Eye Color: ${analysis.eyes}`,

    "",

    "RECOMMENDED COLORS",

    ...palettes[analysis.under],

    "",

    "BEAUTY RECOMMENDATIONS",

    "Choose hijab shades matching your undertone.",
    "Explore suitable lipstick and blush colors.",
    "Test foundation in natural lighting.",

    "",

    "Note: This is a preliminary beauty recommendation."

  ];

  content.forEach(line => {

    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    doc.text(line,20,y);
    y += 9;

  });

  doc.save("Personal-Beauty-Report.pdf");

};
