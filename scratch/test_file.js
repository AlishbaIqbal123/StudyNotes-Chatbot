const url = "https://Alishba-1342-lumina-backend.hf.space/process";

const formData = new FormData();
formData.append("type", "file");
const fileBlob = new Blob(["This is a test file for Lumina Atelier Ingestion. It discusses the concept of photosynthesis and cellular respiration in plants. Plants use sunlight to synthesize nutrients from carbon dioxide and water."], { type: "text/plain" });
formData.append("file", fileBlob, "test.txt");
formData.append("generation_type", "all");

console.log("Sending file to backend via FormData...");
fetch(url, {
  method: "POST",
  body: formData
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
