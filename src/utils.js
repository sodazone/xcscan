export function debounce(func, delay = 300) {
  let timer

  return (args) => {
    clearTimeout(timer)
    return new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        Promise.resolve(func(args)).then(resolve).catch(reject)
      }, delay)
    })
  }
}

export function htmlToElement(html) {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content.firstChild
}
