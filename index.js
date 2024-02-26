const IBM = require('ibm-cos-sdk');
const sharp = require('sharp');

// Configuración de las credenciales de IBM Cloud Object Storage
const cosConfig = {
    endpoint: 'https://s3.eu-es.cloud-object-storage.appdomain.cloud',
    apiKeyId: 'API_KEY',
    serviceInstanceId: 'crn:v1:bluemix:public:cloud-object-storage:global:a/3bf43b3bc1fbc3f14e35ed30d899cf32:dd625d03-aacb-400e-a84f-82a0eced5848::'
};
const cos = new IBM.S3(cosConfig);

const resizeOptions = {
    width: 200,
    height: 200
};

async function resizeImage(key) {
    try {
        const params = {
            Bucket: 'origin',
            Key: key
        };

        const imageObject = await cos.getObject(params).promise();
        const imageBuffer = imageObject.Body;

        const resizedImageBuffer = await sharp(imageBuffer)
            .resize(resizeOptions.width, resizeOptions.height)
            .toBuffer();

        const format = await sharp(resizedImageBuffer).metadata().then(metadata => metadata.format);

        let contentType = 'image/jpeg'; // Valor por defecto
        switch (format) {
            case 'png':
                contentType = 'image/png';
                break;
            case 'jpeg':
                contentType = 'image/jpeg';
                break;
            case 'webp':
                contentType = 'image/webp';
                break;
            // Añade más casos según sea necesario
        }

        const targetParams = {
            Bucket: 'target',
            Key: `resized-${key}`,
            Body: resizedImageBuffer,
            ContentType: contentType
        };

        await cos.putObject(targetParams).promise();

        console.log(`Imagen redimensionada subida a: resized-${key} con formato ${format}`);
    } catch (error) {
        console.error(`Error processing ${key}:`, error.message);
    }
}

async function getBucketContents() {
    console.log('Retrieving bucket contents from: origin');
    const data = await cos.listObjects({Bucket: 'origin'}).promise();
    if (data && data.Contents) {
        data.Contents.forEach((item) => {
            console.log(`Item: ${item.Key} (${item.Size} bytes).`);
        });
    }
    return data.Contents;
}

async function main() {
    try {
        const objects = await getBucketContents();
        const resizePromises = objects.filter(obj => obj.Key.endsWith('.jpg') || obj.Key.endsWith('.jpeg') || obj.Key.endsWith('.png'))
                                       .map(obj => resizeImage(obj.Key));

        await Promise.all(resizePromises); // Parallel processing
    } catch (error) {
        console.error('Error in main:', error.message);
    }
}

main();
