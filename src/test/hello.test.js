test("GET /hello returns hello world", async () => {
  const { GET } = await import("@/app/api/hello/route");

  const request = new Request("http://localhost/api/hello", { method: "GET" });
  const response = await GET(request);

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toEqual({ hello: "Say HI" });
});