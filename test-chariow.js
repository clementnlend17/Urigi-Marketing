// Use native fetch
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function test() {
  const CHARIOW_SECRET_KEY = "sk_q2lwdfto_89987f8e256d61f726af8d76b4e41c13";
  const license_key = "FAKE-KEY-1234";

  console.log("--- Testing GET /v1/licenses/validate ---");
  const res1 = await fetch(`https://api.chariow.com/v1/licenses/validate?license_key=${license_key}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${CHARIOW_SECRET_KEY}`
    }
  });
  console.log("GET Status:", res1.status, await res1.text());

  console.log("--- Testing GET /v1/licenses/:id ---");
  const res3 = await fetch(`https://api.chariow.com/v1/licenses/${license_key}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${CHARIOW_SECRET_KEY}`
    }
  });
  console.log("GET /v1/licenses/:id Status:", res3.status, await res3.text());
}

test();

test();
