declare module 'gifshot' {
  interface CreateGIFOptions {
    images?: string[]
    gifWidth?: number
    gifHeight?: number
    interval?: number
    numFrames?: number
    frameDuration?: number
    text?: string
    fontColor?: string
    fontBackground?: string
    fontSize?: string
    fontFamily?: string
    fontWeight?: string
    textBaseline?: string
    textXCoordinate?: number | null
    textYCoordinate?: number | null
    progressCallback?: (captureProgress: number) => void
    completeCallback?: () => void
  }
  interface CreateGIFResult {
    error: boolean
    errorCode?: string
    errorMsg?: string
    image: string
  }
  function createGIF(options: CreateGIFOptions, callback: (result: CreateGIFResult) => void): void
}
