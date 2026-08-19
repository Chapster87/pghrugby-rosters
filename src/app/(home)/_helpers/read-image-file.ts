/** Read a local image File as a data URL (for Club Logo / Sponsor uploads). */
export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        resolve(result)
        return
      }
      reject(new Error("Could not read image file"))
    }
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image file"))
    reader.readAsDataURL(file)
  })
}
