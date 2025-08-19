// Shared response utilities
export function createSuccessResponse(data: any, functionName: string) {
  return new Response(JSON.stringify({ success: true, data, meta: { timestamp: new Date().toISOString(), function: functionName } }))
}

export function createErrorResponse(error: string, functionName: string, status = 500) {
  return new Response(JSON.stringify({ success: false, error, meta: { timestamp: new Date().toISOString(), function: functionName } }), { status })
}
