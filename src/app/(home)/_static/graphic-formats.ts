export type GraphicFormatId = "portrait" | "story"

export type GraphicFormat = {
  id: GraphicFormatId
  label: string
  width: number
  height: number
}

/** Feed Graphic Format — Instagram portrait, not the HTML tool’s 1080×1080 square. */
export const PORTRAIT_FORMAT: GraphicFormat = {
  id: "portrait",
  label: "Portrait",
  width: 1080,
  height: 1350,
}

export const STORY_FORMAT: GraphicFormat = {
  id: "story",
  label: "Story",
  width: 1080,
  height: 1920,
}

export const GRAPHIC_FORMATS: GraphicFormat[] = [
  PORTRAIT_FORMAT,
  STORY_FORMAT,
]
