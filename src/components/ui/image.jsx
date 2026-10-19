import * as React from "react"
import { cn } from "../../lib/utils"

// Neutral placeholder shown when no source is given or the file fails to load.
const FALLBACK_IMAGE_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f1ebe3"/>' +
      '<path d="M120 200l55-70 40 50 25-30 40 50z" fill="#d8cdbf"/><circle cx="150" cy="105" r="18" fill="#d8cdbf"/></svg>'
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
