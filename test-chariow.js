// Use native fetch

async function test() {
  const CHARIOW_SECRET_KEY = "sk_q2lwdfto_89987f8e256d61f726af8d76b4e41c13";
  const license_key = "FAKE-KEY-1234";

  const res = await fetch("https://api.chariow.com/v1/licenses/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CHARIOW_SECRET_KEY}`
    },
    body: JSON.stringify({ license_key })
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

test();
