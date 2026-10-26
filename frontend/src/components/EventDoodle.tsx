function EventDoodle() {
  return (
    <div className="event-doodle" aria-hidden="true">
      <svg viewBox="0 0 230 150" fill="none">
        <path
          className="doodle-orbit"
          d="M20 109C-4 36 203 8 217 68C231 126 60 153 20 109Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 7"
        />
        <g className="doodle-photo-back">
          <rect
            x="44"
            y="20"
            width="82"
            height="108"
            rx="3"
            fill="#F47B38"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M59 47H108M59 58H94"
            stroke="#FFF8EB"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        <g className="doodle-photo-front">
          <rect
            x="101"
            y="28"
            width="84"
            height="108"
            rx="3"
            fill="#FFF8EB"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="110"
            y="37"
            width="66"
            height="65"
            rx="2"
            fill="#FFDA65"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="132" cy="63" r="3" fill="currentColor" />
          <circle cx="155" cy="63" r="3" fill="currentColor" />
          <path
            d="M130 77Q143 92 157 77"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M122 119H163"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  )
}
export default EventDoodle
