import { useEffect, useRef } from 'react'

// Konten tetap terlihat jika observer tidak didukung atau animasi dikurangi.
export function useScrollReveal<T extends HTMLElement>(refreshKey = 0) {
  const ref = useRef<T>(null)
  const seen = useRef(new WeakSet<Element>())

  useEffect(() => {
    const scope = ref.current
    if (!scope) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const nodes = Array.from(
      scope.querySelectorAll<HTMLElement>('[data-reveal]'),
    ).filter((node) => node.closest('[data-reveal-scope]') === scope)
    let observer: IntersectionObserver | undefined

    function showAll() {
      observer?.disconnect()
      nodes.forEach((node) => node.removeAttribute('data-reveal-state'))
    }

    if (!preference.matches && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            entry.target.setAttribute('data-reveal-state', 'visible')
            seen.current.add(entry.target)
            observer?.unobserve(entry.target)
          })
        },
        { threshold: 0.08 },
      )

      nodes.forEach((node) => {
        if (seen.current.has(node)) return
        node.setAttribute('data-reveal-state', 'pending')
        observer?.observe(node)
      })
    }

    function handlePreference() {
      if (preference.matches) showAll()
    }
    function handleFocus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return
      const node = event.target.closest<HTMLElement>('[data-reveal]')
      if (node && scope?.contains(node)) {
        node.setAttribute('data-reveal-state', 'visible')
        observer?.unobserve(node)
      }
    }

    preference.addEventListener('change', handlePreference)
    scope.addEventListener('focusin', handleFocus)
    return () => {
      showAll()
      preference.removeEventListener('change', handlePreference)
      scope.removeEventListener('focusin', handleFocus)
    }
  }, [refreshKey])

  return ref
}
