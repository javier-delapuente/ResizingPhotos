const IBM = require('ibm-cos-sdk');
const sharp = require('sharp');

// Configuración de las credenciales de IBM Cloud Object Storage
const cosConfig = {
    endpoint: 'https://s3.eu-es.cloud-object-storage.appdomain.cloud',
    apiKeyId: 'API_KEY',
    serviceInstanceId: 'CRN_INSTANCE_ID'
};

// Crear una instancia de IBM Cloud Object Storage
const cos = new IBM.S3(cosConfig);

// Configuración de las opciones de redimensionamiento
const resizeOptions = {
    width: 200,
    height: 200
};

// Función para redimensionar una imagen y subirla al bucket 'target'
async function resizeImage(key) {
    const params = {
        Bucket: 'origin',
        Key: key
    };

    const imageObject = await cos.getObject(params).promise();
    const imageBuffer = imageObject.Body;
    
    // Usar sharp para redimensionar y mantener el formato de la imagen
    const resizedImageBuffer = await sharp(imageBuffer)
        .resize(resizeOptions.width, resizeOptions.height)
        .toBuffer();

    // Usar sharp para obtener información sobre el formato de la imagen
    const format = await sharp(resizedImageBuffer).metadata().then(metadata => metadata.format);
    
    // Determinar el ContentType basado en el formato de la imagen
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
}

// Función para obtener una lista de objetos en el bucket 'origin'
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

// Función principal para procesar las imágenes
async function main() {
    const objects = await getBucketContents();
    if (objects && objects.length > 0) {
        for (const obj of objects) {
            if (obj.Key.endsWith('.jpg') || obj.Key.endsWith('.jpeg') || obj.Key.endsWith('.png')) {
                await resizeImage(obj.Key);
            }
        }
    }
}

main();
