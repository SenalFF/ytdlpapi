
async function fetchInfo() {
  const url = document.getElementById("url").value;
  const res = await fetch("/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  const data = await res.json();
  const infoDiv = document.getElementById("info");
  infoDiv.innerHTML = `
    <h3>${data.title}</h3>
    <img src="${data.thumbnail}" width="320"/><br/><br/>
    ${data.formats.map(f => `
      <div>
        <b>${f.format_note || "Format"}</b> - ${f.ext} - ${Math.round((f.filesize || 0) / 1024 / 1024)} MB
        <a href="/download?url=${encodeURIComponent(url)}&format_id=${f.format_id}&title=${encodeURIComponent(data.title)}">Download</a>
      </div>
    `).join("")}
  `;
}
