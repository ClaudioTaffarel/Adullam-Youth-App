type StreakMascotProps = {
  className?: string
}

function StreakMascot({ className = '' }: StreakMascotProps) {
  return (
    <svg
      className={`streak-mascot ${className}`}
      viewBox="0 0 260 260"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="streak-mascot-body">
        {/* Kaki */}
        <path
          d="M105 208L100 232H77M151 208L160 232H181"
          stroke="#38251d"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tangan kiri */}
        <path
          d="M69 150C43 157 39 178 27 174"
          stroke="#38251d"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Tangan melambai */}
        <g className="streak-mascot-wave">
          <path
            d="M190 148C217 137 223 112 222 94"
            stroke="#38251d"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M222 96L209 81M222 96L225 73M222 96L239 83"
            stroke="#38251d"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>

        {/* Siluet api yang sama dengan halaman akun */}
        <path
          d="M130 25C139 67 180 72 176 113
             C192 104 194 89 193 81
             C225 123 215 183 181 206
             C151 228 101 226 75 202
             C42 171 47 134 70 108
             C67 133 79 143 89 147
             C79 103 114 79 130 25Z"
          fill="#F47B38"
          stroke="#38251d"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Highlight */}
        <path
          d="M127 66C116 97 92 113 99 139"
          stroke="#FFB56F"
          strokeWidth="9"
          strokeLinecap="round"
        />

        <path
          className="streak-mascot-glow"
          d="M129 138C134 162 160 167 156 190
             C153 211 112 214 103 193
             C95 174 118 159 129 138Z"
          fill="#FFDA65"
        />

        {/* Wajah */}
        <g className="streak-mascot-face">
          <g className="streak-mascot-eyes">
            <ellipse
              cx="106"
              cy="133"
              rx="6"
              ry="9"
              fill="#38251d"
            />
            <ellipse
              cx="153"
              cy="133"
              rx="6"
              ry="9"
              fill="#38251d"
            />

            <circle
              className="streak-eye-shine"
              cx="108"
              cy="130"
              r="2"
              fill="#FFF8E8"
            />

            <circle
              className="streak-eye-shine"
              cx="155"
              cy="130"
              r="2"
              fill="#FFF8E8"
            />
          </g>

          <path
            d="M117 151Q130 163 143 151"
            stroke="#38251d"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <ellipse
            cx="91"
            cy="147"
            rx="10"
            ry="5"
            fill="#E65B32"
          />
          <ellipse
            cx="168"
            cy="147"
            rx="10"
            ry="5"
            fill="#E65B32"
          />
        </g>
      </g>
    </svg>
  )
}

export default StreakMascot