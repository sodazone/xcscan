import fs from 'node:fs'
import path from 'node:path'
import ejs from 'ejs'

export function viteEjsPlugin() {
  return {
    name: 'vite-plugin-ejs-on-the-fly',
    order: 'pre',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url.endsWith('.html') || req.url.endsWith('/'))) {
          const fileName = req.url.split('?')[0]
          const filePath = path.join(
            process.cwd(),
            fileName.endsWith('.html') ? fileName : 'index.html'
          )
          if (fs.existsSync(filePath)) {
            try {
              const template = fs.readFileSync(filePath, 'utf8')

              // TODO: variables for templates
              const data = {
                currentPage: req.url.includes('tx')
                  ? 'tx'
                  : req.url.includes('analytics')
                    ? 'analytics'
                    : 'home',
              }

              const html = await ejs.render(template, data, {
                root: path.resolve('partials'),
                async: false,
                filename: filePath,
              })

              res.setHeader('Content-Type', 'text/html')
              res.end(html)
              return
            } catch (err) {
              server.config.logger.error(err)
              res.statusCode = 500
              res.end('Error rendering EJS template')
              return
            }
          }
        }
        next()
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        try {
          const filename = ctx.filename || ''
          // TODO: variables for templates, see server method
          const currentPage = filename.includes('tx')
            ? 'tx'
            : filename.includes('analytics')
              ? 'analytics'
              : 'home'

          const rendered = ejs.render(
            html,
            { currentPage },
            {
              root: path.resolve('partials'),
              filename,
            }
          )

          return rendered
        } catch (err) {
          this.error(
            `[vite-plugin-ejs] Build-time render error: ${err.message}`
          )
          throw err
        }
      },
    },
  }
}
