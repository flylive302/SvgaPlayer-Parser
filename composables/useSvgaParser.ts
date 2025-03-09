import {Parser} from 'svga';

export const useSvgaParser = async (url, outPutFileName) => {
    const parser = new Parser({ isDisableImageBitmapShim: true });
    const parsedSvga = await parser.load(url);

    const jsonString = JSON.stringify(parsedSvga);

    const { data } = await useFetch('/api/writeData', {
        method: 'POST',
        body: {
            fileName: outPutFileName,
            parsedData: jsonString
        },
    })

    console.log(data.value)

    return jsonString;
}