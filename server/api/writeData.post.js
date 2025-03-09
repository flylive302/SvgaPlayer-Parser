// server/api/writeData.post.ts
import fs from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
    try {
        // Use Nuxt's useBody() helper to read the POST data
        const body = await readBody(event);
        // Build an absolute path to where you want to save the file
        const filePath = join(process.cwd(), 'public/parsedAnimations/', body.fileName+'.json');

        // Write the data to a file (synchronously for simplicity)
        fs.writeFileSync(filePath, body.parsedData, 'utf-8')

        return { success: true, message: 'File written successfully.' }
    } catch (error) {
        return { success: false, message: error.message }
    }
})
