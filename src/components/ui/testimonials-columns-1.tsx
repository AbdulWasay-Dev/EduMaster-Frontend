import React from 'react'
import { motion } from 'framer-motion'

export type TestimonialColumnItem = {
  text: string
  image: string
  name: string
  role: string
}

export function TestimonialsColumn({
  className = '',
  testimonials,
  duration = 16,
}: {
  className?: string
  testimonials: TestimonialColumnItem[]
  duration?: number
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        animate={{ translateY: '-50%' }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {testimonials.map(({ text, image, name, role }, index) => (
              <article
                className="w-full max-w-xs rounded-3xl border border-brand-100 bg-white p-6 shadow-lg shadow-brand-500/10"
                key={`${groupIndex}-${name}-${index}`}
              >
                <p className="text-sm leading-7 text-[#334155]">{text}</p>
                <div className="mt-5 flex items-center gap-3">
                  <img
                    width={44}
                    height={44}
                    src={image}
                    alt={name}
                    className="h-11 w-11 rounded-full border border-brand-100 object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold leading-5 tracking-tight text-[#0f172a]">{name}</div>
                    <div className="truncate text-xs leading-5 tracking-tight text-[#64748b]">{role}</div>
                  </div>
                </div>
              </article>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  )
}
