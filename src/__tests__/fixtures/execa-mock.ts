// Stub for 'execa' used in tests
async function execa() {
  return { stdout: '', stderr: '', exitCode: 0 }
}

export default execa as any; 