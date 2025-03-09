import { Player } from 'svga'

export async function useSvgaPlayer(
    canvas: HTMLCanvasElement,
    name: string,
    looped: number
) {
    const player = new Player({
        container: canvas,
        loop: looped
    })

    try {
        const svgaModule = await import(`~/public/parsedAnimations/${name}.json`)
        const svga = svgaModule.default || svgaModule
        await player.mount(svga)
    } catch (error) {
        console.error(`Failed to load animation "${name}":`, error)
        throw error
    }

    // Handle cleanup when the animation ends.
    player.onEnd = () => {
        console.log('Animation ended. Destroying player...')
        player.destroy()
    }

    // Start playing the animation.
    player.start()

    // Return an interface that allows external cleanup of the player instance.
    return {
        destroy: () => player.destroy()
    }
}