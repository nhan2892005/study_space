/** @jest-environment node */

import { GET } from '../app/api/hello/route';  // Adjust path
import { NextRequest } from 'next/server';  // Import để mock request

test("GET /hello returns hello world", async () => {
  // Mock NextRequest (thay vì native Request)
  const request = new NextRequest('http://localhost/api/hello', { method: 'GET' });

  const response = await GET(request);

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toEqual({ hello: "Say HI" });
});