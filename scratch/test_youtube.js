const url = "https://Alishba-1342-lumina-backend.hf.space/process";

const formData = new URLSearchParams();
formData.append("type", "youtube");
formData.append("url", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"); // Rick Astley - Never Gonna Give You Up (it has manual captions/transcripts or autos)
formData.append("generation_type", "all");

console.log("Sending Rick Astley video to backend...");
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
    console.log("Response JSON:", JSON.stringify(json, null, 2).slice(0, 1000) + "\n...[TRUNCATED]...");
  } catch (e) {
    console.log("Raw Response Text:", text);
  }
})
.catch((err) => {
  console.error("Fetch error:", err);
});
