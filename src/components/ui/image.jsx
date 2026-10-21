import * as React from "react"
import { cn } from "../../lib/utils"

// Neutral placeholder shown when no source is given or the file fails to load.
const FALLBACK_IMAGE_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3D1E00"/>' +
      '<stop offset=".6" stop-color="#7A3A06"/><stop offset="1" stop-color="#FF8E24"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#g)"/>' +
      '<text x="200" y="185" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-size="150" font-weight="800" fill="#FFF9F0" fill-opacity=".16">Z.</text></svg>'
  )

/**
 * Plain image with a graceful fallback. `fittingType="fill"` crops (object-cover),
 * `"fit"` letterboxes (object-contain). Extra props go straight to the <img>.
 */
const Image = React.forwardRef(
  (
    {
      src,
      fittingType = "fill",
      // Kept so existing call sites stay valid; layout is driven by CSS.
      originWidth,
      originHeight,
      focalPointX,
      focalPointY,
      quality,
      className,
      loading = "lazy",
      decoding = "async",
      onError,
      alt = "",
      ...props
    },
    ref
  ) => {
    const [failed, setFailed] = React.useState(false)
    React.useEffect(() => setFailed(false), [src])

    const empty = !src
    const showFallback = empty || failed
    const hasObjectFit = /\bobject-(cover|contain|fill|none|scale-down)\b/.test(className || "")
    const fit = hasObjectFit ? "" : fittingType === "fit" ? "object-contain" : "object-cover"
    const focal =
      typeof focalPointX === "number" && typeof focalPointY === "number"
        ? { objectPosition: `${focalPointX * 100}% ${focalPointY * 100}%` }
        : undefined

    return (
      <img
        ref={ref}
        src={showFallback ? FALLBACK_IMAGE_URL : src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={cn(fit, className)}
        width={originWidth}
        height={originHeight}
        {...props}
        style={{ ...focal, ...props.style }}
        onError={(event) => {
          if (!failed) setFailed(true)
          onError?.(event)
        }}
        data-empty-image={empty || undefined}
      />
    )
  }
)
Image.displayName = "Image"

export { Image }
