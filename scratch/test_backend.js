const url = "https://Alishba-1342-lumina-backend.hf.space/process";

const formData = new URLSearchParams();
formData.append("type", "text");
formData.append("content", "This is a simple test document about photosynthesis. Photosynthesis is the process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's activities.");
formData.append("generation_type", "all");

console.log("Sending request to backend...");
fetch(url, {
  method: "POST",
  body: formData,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  }
})
.then(async (res) => {
  console.log("Status code:", res.status);
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    console.log("Response JSON:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.log("Raw Response Text:", text);
  }
})
.catch((err) => {
  console.error("Fetch error:", err);
});
